"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ArrowLeft, Share2, BarChart3 } from "lucide-react";
import type { FlowWithSteps } from "@/types/flow";
import StepScreenshotViewer from "../components/step-screenshot-viewer";
import DeleteFlowDialog from "../components/delete-flow-dialog";
import ShareFlowDialog from "../components/share-flow-dialog";
import InlineEditableTitle from "../components/inline-editable-title";
import { useFlow } from "@/hooks/use-flows";

type FlowDetailClientProps = {
  flow: FlowWithSteps & {
    tenant: {
      id: string;
      name: string;
    };
  };
};

export default function FlowDetailClient({
  flow: initialFlow,
}: FlowDetailClientProps) {
  // Use React Query for reactive updates
  const { data: flowData } = useFlow(initialFlow.id);
  const flow = flowData || initialFlow;
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const steps = flow.steps;
  const activeStep = steps[activeStepIndex];
  const totalSteps = steps.length;

  // Handler functions - defined before useEffect that uses them
  const handleBack = useCallback(() => {
    router.push("/dashboard/flows");
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/dashboard/flows/${flow.id}/edit`);
  }, [router, flow.id]);

  const handleViewAnalytics = useCallback(() => {
    router.push(`/dashboard/flows/${flow.id}/analytics`);
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
    handlePrevious,
    handleNext,
    handleTogglePlay,
  ]);

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
                aria-label="Back to flows"
                title="Back to flows"
              >
                <ArrowLeft className="h-4 w-4 text-current" />
                <span className="sr-only">Back to flows</span>
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
                onClick={handleViewAnalytics}
                title="View analytics"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                title="Share flow"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                title="Edit flow steps and details"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="bg-muted/30 flex flex-1 items-center justify-center overflow-auto p-4">
            {activeStep ? (
              <StepScreenshotViewer step={activeStep} />
            ) : (
              <Skeleton className="h-[70vh] w-full max-w-6xl" />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ShareFlowDialog
        flowId={flow.id}
        flowName={flow.name}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
      <DeleteFlowDialog
        flow={flow}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
