"use client";

import { R2Image } from "@/components/r2-image";
import type { FlowStep } from "@/lib/generated/prisma/client";

type StepScreenshotViewerProps = {
  step: FlowStep;
};

export default function StepScreenshotViewer({
  step,
}: StepScreenshotViewerProps) {
  const screenshotUrl = step.screenshotFullUrl || step.screenshotThumbUrl;
  const meta = step.meta as {
    clickCoordinates?: { x: number; y: number };
  } | null;
  const clickCoords = meta?.clickCoordinates;

  if (!screenshotUrl) {
    return (
      <div className="bg-muted flex h-[70vh] w-full max-w-6xl items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">No screenshot available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
      {/* Screenshot Container - border wraps image exactly */}
      <div className="border-border bg-background relative inline-block max-h-[calc(100vh-12rem)] max-w-[90%] rounded-lg border-2">
        <R2Image
          src={screenshotUrl}
          alt={step.explanation}
          className="block max-h-[calc(100vh-12rem)] w-auto max-w-full rounded-md"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority
          fallback={
            <div className="bg-muted flex h-96 w-96 items-center justify-center rounded-md">
              <p className="text-muted-foreground">No screenshot available</p>
            </div>
          }
        />

        {/* Click Coordinate Overlay */}
        {clickCoords && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${clickCoords.x}px`,
              top: `${clickCoords.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="bg-primary/20 absolute h-8 w-8 animate-pulse rounded-full" />
            <div className="bg-primary absolute h-3 w-3 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
