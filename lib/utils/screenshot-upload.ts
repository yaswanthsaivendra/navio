"use server";

import {
  uploadScreenshot,
  generateScreenshotKey,
  base64ToBuffer,
} from "@/lib/storage";

/**
 * Screenshot upload result for a single step
 */
export interface StepScreenshotUploads {
  stepId: string;
  screenshotThumbUrl: string | null;
  screenshotFullUrl: string | null;
}

/**
 * Upload screenshots for a flow step
 * Handles both thumbnail and full screenshot uploads with error handling
 * Returns null URLs if uploads fail (non-critical errors)
 */
export async function uploadStepScreenshots(
  flowId: string,
  stepId: string,
  stepMeta: {
    screenshotThumb?: string;
    screenshotFull?: string;
  }
): Promise<StepScreenshotUploads> {
  const uploads: StepScreenshotUploads = {
    stepId,
    screenshotThumbUrl: null,
    screenshotFullUrl: null,
  };

  // Upload thumbnail if present
  if (stepMeta.screenshotThumb) {
    try {
      const { buffer, contentType } = base64ToBuffer(
        stepMeta.screenshotThumb as string
      );
      const key = generateScreenshotKey(
        flowId,
        stepId,
        "thumb",
        contentType.includes("jpeg") ? "jpg" : "png"
      );
      uploads.screenshotThumbUrl = await uploadScreenshot(
        key,
        buffer,
        contentType
      );
    } catch {
      // Log error but don't throw - step will exist without thumbnail
      // Error logging should be handled by the calling code or logging system
    }
  }

  // Upload full screenshot if present
  if (stepMeta.screenshotFull) {
    try {
      const { buffer, contentType } = base64ToBuffer(
        stepMeta.screenshotFull as string
      );
      const key = generateScreenshotKey(
        flowId,
        stepId,
        "full",
        contentType.includes("jpeg") ? "jpg" : "png"
      );
      uploads.screenshotFullUrl = await uploadScreenshot(
        key,
        buffer,
        contentType
      );
    } catch {
      // Log error but don't throw - step will exist without full screenshot
      // Error logging should be handled by the calling code or logging system
    }
  }

  return uploads;
}

/**
 * Upload screenshots for multiple flow steps
 * Returns an array of upload results, one per step
 * Uses Promise.allSettled to ensure all uploads are attempted even if some fail
 */
export async function uploadFlowStepScreenshots(
  flowId: string,
  steps: Array<{
    id: string;
    meta?: {
      screenshotThumb?: string;
      screenshotFull?: string;
    };
  }>
): Promise<StepScreenshotUploads[]> {
  const uploadResults = await Promise.allSettled(
    steps.map((step) => uploadStepScreenshots(flowId, step.id, step.meta || {}))
  );

  return uploadResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // If upload failed completely, return null URLs
    return {
      stepId: steps[index].id,
      screenshotThumbUrl: null,
      screenshotFullUrl: null,
    };
  });
}
