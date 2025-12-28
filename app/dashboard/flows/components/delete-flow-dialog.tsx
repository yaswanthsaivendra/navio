"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteFlow } from "@/hooks/use-flows";
import type { FlowWithSteps } from "@/types/flow";

type DeleteFlowDialogProps = {
  flow: FlowWithSteps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteFlowDialog({
  flow,
  open,
  onOpenChange,
}: DeleteFlowDialogProps) {
  const deleteFlow = useDeleteFlow();

  const handleDelete = async () => {
    try {
      await deleteFlow.mutateAsync(flow.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete flow:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Flow?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{flow.name}&quot;? This action
            cannot be undone and will delete all {flow.steps.length} step
            {flow.steps.length !== 1 ? "s" : ""} in this flow.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteFlow.isPending}
          >
            {deleteFlow.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
