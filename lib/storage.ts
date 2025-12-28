import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { FlowError } from "./errors";

// Initialize S3 client for Cloudflare R2
// Note: R2 requires forcePathStyle: true and proper endpoint format
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required for R2 - uses path-style addressing
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "screenshots";
const CDN_DOMAIN = process.env.R2_CDN_DOMAIN || process.env.R2_PUBLIC_URL;

/**
 * Retry configuration for R2 uploads
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second base delay

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a screenshot to R2 with retry logic
 * @param key - Object key (path) in the bucket
 * @param buffer - Image buffer
 * @param contentType - MIME type (e.g., "image/png", "image/jpeg")
 * @param retries - Number of retries remaining (internal use)
 * @returns CDN URL of the uploaded screenshot
 */
export async function uploadScreenshot(
  key: string,
  buffer: Buffer,
  contentType: string = "image/png",
  retries: number = MAX_RETRIES
): Promise<string> {
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new FlowError(
      "R2 storage is not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables.",
      "STORAGE_NOT_CONFIGURED",
      500
    );
  }

  // Validate buffer size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_SIZE) {
    throw new FlowError(
      `Screenshot too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`,
      "SCREENSHOT_TOO_LARGE",
      413
    );
  }

  // Validate content type
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new FlowError(
      `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
      "INVALID_CONTENT_TYPE",
      400
    );
  }

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Make objects publicly readable if CDN domain is configured
      ...(CDN_DOMAIN && { ACL: "public-read" }),
      // Add cache control headers for CDN
      CacheControl: "public, max-age=31536000, immutable", // 1 year cache
    });

    await s3Client.send(command);

    // Return CDN URL or R2 public URL
    if (CDN_DOMAIN) {
      return `https://${CDN_DOMAIN}/${key}`;
    }

    // Fallback to R2 public URL if no custom domain
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
  } catch (error) {
    // Retry on transient errors (including SSL handshake failures)
    if (retries > 0 && error instanceof Error) {
      const isRetryable =
        error.message.includes("timeout") ||
        error.message.includes("ECONNRESET") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("EPROTO") ||
        error.message.includes("SSL") ||
        error.message.includes("handshake");

      if (isRetryable) {
        const delay = RETRY_DELAY_MS * (MAX_RETRIES - retries + 1); // Exponential backoff
        console.warn(
          `R2 upload failed, retrying in ${delay}ms (${retries} retries left):`,
          error.message
        );
        await sleep(delay);
        return uploadScreenshot(key, buffer, contentType, retries - 1);
      }
    }

    // Log error for debugging
    console.error(`Failed to upload screenshot to R2:`, {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.name : "Unknown",
      retriesRemaining: retries,
      endpoint: process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : "not configured",
    });

    throw new FlowError(
      `Failed to upload screenshot after ${MAX_RETRIES} attempts. Please try again.`,
      "UPLOAD_FAILED",
      500
    );
  }
}

/**
 * Delete a screenshot from R2
 * @param key - Object key (path) in the bucket
 */
export async function deleteScreenshot(key: string): Promise<void> {
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    // Silently fail if storage is not configured (for development)
    console.warn("R2 storage is not configured, skipping screenshot deletion");
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    // Log error but don't throw - cleanup failures shouldn't break the flow
    console.error(`Failed to delete screenshot ${key}:`, error);
  }
}

/**
 * Generate a unique key for a screenshot
 * Format: screenshots/{flowId}/{stepId}/{type}-{timestamp}.{ext}
 * @param flowId - Flow ID
 * @param stepId - Step ID
 * @param type - "thumb" or "full"
 * @param extension - File extension (e.g., "png", "jpg")
 */
export function generateScreenshotKey(
  flowId: string,
  stepId: string,
  type: "thumb" | "full",
  extension: string = "png"
): string {
  const timestamp = Date.now();
  return `screenshots/${flowId}/${stepId}/${type}-${timestamp}.${extension}`;
}

/**
 * Extract screenshot key from CDN URL
 * @param url - CDN URL
 * @returns Object key or null if URL is invalid
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle CDN domain URLs
    if (CDN_DOMAIN && url.includes(CDN_DOMAIN)) {
      const path = new URL(url).pathname;
      return path.startsWith("/") ? path.substring(1) : path;
    }

    // Handle R2 public URLs
    if (url.includes("r2.cloudflarestorage.com")) {
      const parts = url.split("/");
      const bucketIndex = parts.findIndex((p) => p === BUCKET_NAME);
      if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
        return parts.slice(bucketIndex + 1).join("/");
      }
    }

    // Try to extract from any URL format
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    if (path.includes("screenshots/")) {
      return path.startsWith("/") ? path.substring(1) : path;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert Base64 data URL to Buffer with validation
 * @param dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @returns Object with buffer and content type
 */
export function base64ToBuffer(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
} {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new FlowError(
      "Invalid screenshot data. Expected a base64 data URL.",
      "INVALID_DATA_URL",
      400
    );
  }

  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    throw new FlowError(
      "Invalid base64 data URL format. Expected format: data:image/png;base64,...",
      "INVALID_DATA_URL",
      400
    );
  }

  const contentType = matches[1] || "image/png";
  const base64Data = matches[2];

  // Validate content type
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new FlowError(
      `Invalid image type: ${contentType}. Allowed types: ${allowedTypes.join(", ")}`,
      "INVALID_CONTENT_TYPE",
      400
    );
  }

  // Validate base64 data
  if (!base64Data || base64Data.length === 0) {
    throw new FlowError(
      "Empty base64 data. Screenshot data is required.",
      "EMPTY_SCREENSHOT_DATA",
      400
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    throw new FlowError(
      "Invalid base64 encoding. Could not decode screenshot data.",
      "INVALID_BASE64",
      400
    );
  }

  // Validate buffer size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_SIZE) {
    throw new FlowError(
      `Screenshot too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`,
      "SCREENSHOT_TOO_LARGE",
      413
    );
  }

  // Validate minimum size (should be at least a few KB for a valid image)
  const MIN_SIZE = 1024; // 1KB
  if (buffer.length < MIN_SIZE) {
    throw new FlowError(
      "Screenshot data too small. The image may be corrupted.",
      "SCREENSHOT_TOO_SMALL",
      400
    );
  }

  return { buffer, contentType };
}
