"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import StepScreenshotViewer from "@/app/dashboard/flows/components/step-screenshot-viewer";
import type { Flow, FlowStep } from "@/lib/generated/prisma/client";

// Type for public flow (without creator requirement)
type PublicFlow = Flow & {
  steps: FlowStep[];
};

type PublicFlowViewerProps = {
  flow: PublicFlow;
  shareId: string;
};

// Generate a session ID for this viewer (stored in sessionStorage)
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = `navio_session_${window.location.pathname}`;
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

// Track analytics event
async function trackEvent(
  flowId: string,
  shareId: string,
  eventType: "VIEW" | "FLOW_COMPLETE",
  sessionId: string
) {
  try {
    await fetch("/api/public/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flowId,
        shareId,
        eventType,
        sessionId,
      }),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the UI
    console.error("Failed to track analytics event:", error);
  }
}

export default function PublicFlowViewer({
  flow,
  shareId,
}: PublicFlowViewerProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [sessionId] = useState(() => getSessionId());
  const hasTrackedViewRef = useRef(false);

  const steps = flow.steps;
  const activeStep = steps[activeStepIndex];
  const totalSteps = steps.length;

  // Track VIEW event on mount (only once)
  useEffect(() => {
    if (!hasTrackedViewRef.current && sessionId) {
      hasTrackedViewRef.current = true;
      trackEvent(flow.id, shareId, "VIEW", sessionId);
    }
  }, [flow.id, shareId, sessionId]);

  // Track FLOW_COMPLETE when user reaches last step (only once)
  const hasTrackedCompleteRef = useRef(false);
  useEffect(() => {
    if (
      activeStepIndex === totalSteps - 1 &&
      totalSteps > 0 &&
      sessionId &&
      !hasTrackedCompleteRef.current
    ) {
      hasTrackedCompleteRef.current = true;
      trackEvent(flow.id, shareId, "FLOW_COMPLETE", sessionId);
    }
  }, [activeStepIndex, totalSteps, flow.id, shareId, sessionId]);

  const handlePrevious = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "Home":
          e.preventDefault();
          setActiveStepIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveStepIndex(totalSteps - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePrevious, handleNext, totalSteps]);

  if (totalSteps === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <div className="flex flex-col items-center justify-center px-8 py-12">
            <p className="text-muted-foreground text-lg">
              This flow has no steps yet
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Minimal Header */}
      <div className="bg-background/95 border-b backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{flow.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {activeStep ? (
          <div className="w-full max-w-6xl">
            <StepScreenshotViewer
              step={activeStep}
              steps={steps}
              activeStepIndex={activeStepIndex}
              onNavigateBack={handlePrevious}
              onNavigateForward={handleNext}
              canGoBack={activeStepIndex > 0}
              canGoForward={activeStepIndex < totalSteps - 1}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
