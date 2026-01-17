"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Maximize, Minimize, ArrowLeft } from "lucide-react";
import type { FlowWithSteps } from "@/types/flow";
import StepScreenshotViewer from "../../components/step-screenshot-viewer";
import StepTimeline from "../../components/step-timeline";
import DeleteFlowDialog from "../../components/delete-flow-dialog";
import InlineEditableTitle from "../../components/inline-editable-title";
import { useFlow } from "@/hooks/use-flows";

type FlowEditClientProps = {
  flow: FlowWithSteps & {
    tenant: {
      id: string;
      name: string;
    };
  };
};

export default function FlowEditClient({
  flow: initialFlow,
}: FlowEditClientProps) {
  // Use React Query for reactive updates
  const { data: flowData } = useFlow(initialFlow.id);
  const flow = flowData || initialFlow;
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const steps = flow.steps;
  const activeStep = steps[activeStepIndex];
  const totalSteps = steps.length;

  // Handler functions - defined before useEffect that uses them
  const handleBack = useCallback(() => {
    router.push(`/dashboard/flows/${flow.id}`);
  }, [router, flow.id]);

  const handlePrevious = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    setIsPlaying(false);
  }, [totalSteps]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4000); // 4 seconds per step

    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

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
        case " ":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "Home":
          e.preventDefault();
          setActiveStepIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveStepIndex(totalSteps - 1);
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleToggleFullscreen();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            handleToggleFullscreen();
          }
          break;
        default:
          // Number keys 1-9 to jump to step
          const num = parseInt(e.key);
          if (num >= 1 && num <= 9 && num <= totalSteps) {
            e.preventDefault();
            setActiveStepIndex(num - 1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeStepIndex,
    totalSteps,
    isFullscreen,
    handlePrevious,
    handleNext,
    handleTogglePlay,
    handleToggleFullscreen,
  ]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleStepClick = useCallback((index: number) => {
    setActiveStepIndex(index);
    setIsPlaying(false);
  }, []);

  if (totalSteps === 0) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">
              This flow has no steps yet
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background fixed inset-0 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="shrink-0"
                aria-label="Back to flow detail"
                title="Back to flow detail"
              >
                <ArrowLeft className="h-4 w-4 text-current" />
                <span className="sr-only">Back to flow detail</span>
              </Button>
              <div className="bg-border h-6 w-px" />
              <InlineEditableTitle
                flowId={flow.id}
                initialName={flow.name}
                className="min-w-0 flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Timeline */}
          <div className="bg-background w-32 border-r">
            <StepTimeline
              steps={steps}
              activeStepIndex={activeStepIndex}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Main Content Area */}
          <div className="bg-muted/30 flex flex-1 items-center justify-center overflow-auto p-4">
            {activeStep ? (
              <StepScreenshotViewer
                step={activeStep}
                onNavigateBack={handlePrevious}
                onNavigateForward={handleNext}
                canGoBack={activeStepIndex > 0}
                canGoForward={activeStepIndex < totalSteps - 1}
              />
            ) : (
              <Skeleton className="h-[70vh] w-full max-w-6xl" />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DeleteFlowDialog
        flow={flow}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
