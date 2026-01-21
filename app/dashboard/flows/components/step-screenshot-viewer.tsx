"use client";

import { useState, useEffect, useRef } from "react";
import { R2Image } from "@/components/r2-image";
import { BrowserMockup } from "@/components/browser-mockup";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeR2UrlClient } from "@/lib/utils/r2-url";
import type { FlowStep } from "@/lib/generated/prisma/client";

type StepScreenshotViewerProps = {
  step: FlowStep;
  steps?: FlowStep[]; // All steps for preloading
  activeStepIndex?: number; // Current step index for preloading
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
};

/**
 * Preload an image by creating an Image object
 * Returns a promise that resolves when image is loaded
 */
function preloadImage(url: string | null | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }

    const normalizedUrl = normalizeR2UrlClient(url);
    if (!normalizedUrl) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to not block UI
    img.src = normalizedUrl;
  });
}

export default function StepScreenshotViewer({
  step,
  steps,
  activeStepIndex,
  onNavigateBack,
  onNavigateForward,
  canGoBack = false,
  canGoForward = false,
}: StepScreenshotViewerProps) {
  const screenshotUrl = step.screenshotFullUrl || step.screenshotThumbUrl;
  const meta = step.meta as {
    clickCoordinates?: { x: number; y: number };
  } | null;
  const clickCoords = meta?.clickCoordinates;

  // State for image loading and transitions
  const [displayedImageUrl, setDisplayedImageUrl] = useState(screenshotUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true); // Start as true for initial image
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  const previousScreenshotUrlRef = useRef<string | null>(screenshotUrl);
  const isInitialMountRef = useRef(true);

  // Preload initial image and mark as loaded
  useEffect(() => {
    if (isInitialMountRef.current && screenshotUrl) {
      isInitialMountRef.current = false;
      // Preload initial image in background, but show it immediately
      preloadImage(screenshotUrl).then(() => {
        preloadedImagesRef.current.add(screenshotUrl);
      });
      // Image is already in displayedImageUrl, so it will show immediately
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Preload adjacent images when step changes
  useEffect(() => {
    if (!steps || activeStepIndex === undefined) return;

    const preloadAdjacent = async () => {
      // Preload next image
      if (canGoForward && steps[activeStepIndex + 1]) {
        const nextStep = steps[activeStepIndex + 1];
        const nextUrl =
          nextStep.screenshotFullUrl || nextStep.screenshotThumbUrl;
        if (nextUrl && !preloadedImagesRef.current.has(nextUrl)) {
          await preloadImage(nextUrl);
          preloadedImagesRef.current.add(nextUrl);
        }
      }

      // Preload previous image
      if (canGoBack && steps[activeStepIndex - 1]) {
        const prevStep = steps[activeStepIndex - 1];
        const prevUrl =
          prevStep.screenshotFullUrl || prevStep.screenshotThumbUrl;
        if (prevUrl && !preloadedImagesRef.current.has(prevUrl)) {
          await preloadImage(prevUrl);
          preloadedImagesRef.current.add(prevUrl);
        }
      }
    };

    preloadAdjacent();
  }, [activeStepIndex, canGoBack, canGoForward, steps]);

  // Handle step change with smooth transition
  useEffect(() => {
    // Skip on initial mount (handled by separate effect)
    if (isInitialMountRef.current) {
      return;
    }

    const previousUrl = previousScreenshotUrlRef.current;
    previousScreenshotUrlRef.current = screenshotUrl;

    // If URL hasn't changed, no action needed
    if (screenshotUrl === previousUrl) {
      return;
    }

    if (!screenshotUrl) {
      // No screenshot - update state in next tick
      requestAnimationFrame(() => {
        setImageLoaded(false);
        setIsLoading(false);
        setDisplayedImageUrl(null);
      });
      return;
    }

    // Check if image is already preloaded
    if (preloadedImagesRef.current.has(screenshotUrl)) {
      // Instant transition if preloaded
      requestAnimationFrame(() => {
        setDisplayedImageUrl(screenshotUrl);
        setImageLoaded(true);
        setIsLoading(false);
      });
    } else {
      // Load image with loading state
      requestAnimationFrame(() => {
        setIsLoading(true);
        setImageLoaded(false);
      });

      preloadImage(screenshotUrl).then(() => {
        preloadedImagesRef.current.add(screenshotUrl);
        setDisplayedImageUrl(screenshotUrl);
        setImageLoaded(true);
        setIsLoading(false);
      });
    }
  }, [screenshotUrl]);

  if (!screenshotUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <BrowserMockup
          url={step.url}
          className="w-full max-w-6xl"
          onNavigateBack={onNavigateBack}
          onNavigateForward={onNavigateForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        >
          <div className="bg-muted flex h-96 w-full items-center justify-center">
            <p className="text-muted-foreground">No screenshot available</p>
          </div>
        </BrowserMockup>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
      <BrowserMockup
        url={step.url}
        className="w-full max-w-6xl"
        onNavigateBack={onNavigateBack}
        onNavigateForward={onNavigateForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      >
        {/* Screenshot Container */}
        <div className="relative flex w-full items-start justify-center bg-white">
          <div className="relative min-h-[400px] w-full">
            {/* Skeleton loader - shown while loading */}
            {isLoading && !imageLoaded && (
              <div className="absolute inset-0 z-0">
                <Skeleton className="h-full w-full" />
              </div>
            )}

            {/* Previous image fading out (if different from current) */}
            {displayedImageUrl !== screenshotUrl && displayedImageUrl && (
              <div className="absolute inset-0 z-0">
                <R2Image
                  src={displayedImageUrl}
                  alt={step.explanation}
                  className="block h-auto w-full object-contain opacity-0 transition-opacity duration-300"
                />
              </div>
            )}

            {/* Current image fading in */}
            {displayedImageUrl && (
              <div
                className={`relative z-10 transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              >
                <R2Image
                  src={displayedImageUrl}
                  alt={step.explanation}
                  className="block h-auto w-full object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority
                  fallback={
                    <div className="bg-muted flex h-96 w-full items-center justify-center">
                      <p className="text-muted-foreground">
                        No screenshot available
                      </p>
                    </div>
                  }
                />
              </div>
            )}

            {/* Click Coordinate Overlay */}
            {clickCoords && imageLoaded && (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: `${clickCoords.x}px`,
                  top: `${clickCoords.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="bg-primary/20 absolute h-8 w-8 animate-pulse rounded-full" />
                <div className="bg-primary ring-primary/30 absolute h-3 w-3 rounded-full ring-2" />
              </div>
            )}
          </div>
        </div>
      </BrowserMockup>
    </div>
  );
}
