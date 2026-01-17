"use client";

import { R2Image } from "@/components/r2-image";
import { BrowserMockup } from "@/components/browser-mockup";
import type { FlowStep } from "@/lib/generated/prisma/client";

type StepScreenshotViewerProps = {
  step: FlowStep;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
};

export default function StepScreenshotViewer({
  step,
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
          <div className="relative w-full">
            <R2Image
              src={screenshotUrl}
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

            {/* Click Coordinate Overlay */}
            {clickCoords && (
              <div
                className="pointer-events-none absolute z-10"
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
