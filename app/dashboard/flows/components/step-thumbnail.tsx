"use client";

import { R2Image } from "@/components/r2-image";
import { cn } from "@/lib/utils";
import type { FlowStep } from "@/lib/generated/prisma/client";
import { Layers } from "lucide-react";

type StepThumbnailProps = {
  step: FlowStep;
  stepNumber: number;
  isActive: boolean;
  onClick: () => void;
};

export default function StepThumbnail({
  step,
  stepNumber,
  isActive,
  onClick,
}: StepThumbnailProps) {
  const thumbnailUrl = step.screenshotThumbUrl;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-28 w-28 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border-2 transition-all",
        isActive
          ? "border-primary scale-105 shadow-lg"
          : "border-border hover:border-primary/50"
      )}
      aria-label={`Step ${stepNumber}: ${step.explanation}`}
    >
      {/* Thumbnail Image */}
      <div className="relative h-full w-full">
        {thumbnailUrl ? (
          <R2Image
            src={thumbnailUrl}
            alt={`Step ${stepNumber}`}
            fill
            className="object-cover"
            sizes="112px"
            fallback={
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <Layers className="text-muted-foreground h-6 w-6" />
              </div>
            }
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Layers className="text-muted-foreground h-6 w-6" />
          </div>
        )}
      </div>

      {/* Step Number Badge */}
      <div
        className={cn(
          "absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-background/90 text-foreground"
        )}
      >
        {stepNumber}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-1 right-1">
          <div className="bg-primary h-2 w-2 rounded-full" />
        </div>
      )}

      {/* Hover Overlay */}
      <div className="bg-background/80 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-xs font-medium">{step.explanation}</span>
      </div>
    </button>
  );
}
