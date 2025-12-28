"use client";

import { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepThumbnail from "./step-thumbnail";
import type { FlowStep } from "@/lib/generated/prisma/client";

type StepTimelineProps = {
  steps: FlowStep[];
  activeStepIndex: number;
  onStepClick: (index: number) => void;
};

export default function StepTimeline({
  steps,
  activeStepIndex,
  onStepClick,
}: StepTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active step
  useEffect(() => {
    if (activeThumbnailRef.current && timelineRef.current) {
      const thumbnailContainer = activeThumbnailRef.current;
      const timeline = timelineRef.current;
      const thumbnailRect = thumbnailContainer.getBoundingClientRect();
      const timelineRect = timeline.getBoundingClientRect();

      // Check if thumbnail is outside viewport (vertical)
      if (
        thumbnailRect.top < timelineRect.top ||
        thumbnailRect.bottom > timelineRect.bottom
      ) {
        thumbnailContainer.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [activeStepIndex]);

  const handleScroll = (direction: "up" | "down") => {
    if (timelineRef.current) {
      const scrollAmount = 300;
      timelineRef.current.scrollBy({
        top: direction === "up" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Scroll Buttons */}
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="bg-background/80 backdrop-blur"
          onClick={() => handleScroll("up")}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="bg-background/80 backdrop-blur"
          onClick={() => handleScroll("down")}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="scrollbar-hide flex flex-col gap-3 overflow-y-auto px-3 py-12"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.id}
            ref={index === activeStepIndex ? activeThumbnailRef : null}
            className="shrink-0"
          >
            <StepThumbnail
              step={step}
              stepNumber={index + 1}
              isActive={index === activeStepIndex}
              onClick={() => onStepClick(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
