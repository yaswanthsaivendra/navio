/**
 * Normalize R2 image URLs (server-side only)
 * Replaces placeholder domains with API proxy URLs (since R2 bucket may not be public)
 */
export function normalizeR2Url(url: string | null | undefined): string | null {
  if (!url) return null;

  // If URL contains placeholder domain or R2 domain, use API proxy
  if (
    url.includes("your_custom_domain.com") ||
    url.includes("r2.cloudflarestorage.com")
  ) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Extract the key
      let key: string;

      if (url.includes("your_custom_domain.com")) {
        // From placeholder: /screenshots/flow/step/file.jpg
        key = path.startsWith("/") ? path.substring(1) : path;
      } else {
        // From R2 URL: /bucket-name/screenshots/flow/step/file.jpg
        const parts = path.split("/").filter(Boolean);
        // Skip bucket name (first part) and get the rest
        if (parts.length >= 2) {
          key = parts.slice(1).join("/");
        } else {
          key = path.startsWith("/") ? path.substring(1) : path;
        }
      }

      // Use API proxy instead of direct R2 URL
      // This works even if the bucket is not publicly accessible
      return `/api/images/${key}`;
    } catch {
      // Invalid URL, return original
      return url;
    }
  }

  return url;
}

/**
 * Client-side URL normalization (extracts key and uses API proxy)
 * Uses API proxy to avoid R2 bucket public access requirements
 */
export function normalizeR2UrlClient(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  // If URL contains placeholder domain or R2 domain, use API proxy
  if (
    url.includes("your_custom_domain.com") ||
    url.includes("r2.cloudflarestorage.com")
  ) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Extract the key
      let key: string;

      if (url.includes("your_custom_domain.com")) {
        // From placeholder: /screenshots/flow/step/file.jpg
        key = path.startsWith("/") ? path.substring(1) : path;
      } else {
        // From R2 URL: /bucket-name/screenshots/flow/step/file.jpg
        const parts = path.split("/").filter(Boolean);
        // Skip bucket name (first part) and get the rest
        if (parts.length >= 2) {
          key = parts.slice(1).join("/");
        } else {
          key = path.startsWith("/") ? path.substring(1) : path;
        }
      }

      // Use API proxy
      return `/api/images/${key}`;
    } catch {
      return url;
    }
  }

  return url;
}
