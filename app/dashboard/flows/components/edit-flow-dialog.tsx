"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateFlowSchema, type UpdateFlowInput } from "@/lib/validations/flow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateFlow } from "@/hooks/use-flows";
import type { FlowWithSteps } from "@/types/flow";

type EditFlowDialogProps = {
  flow: FlowWithSteps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditFlowDialog({
  flow,
  open,
  onOpenChange,
}: EditFlowDialogProps) {
  const updateFlow = useUpdateFlow();
  const [tags, setTags] = useState<string[]>(
    ((flow.meta as { tags?: string[] } | null)?.tags || []).slice(0, 10)
  );
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateFlowInput>({
    resolver: zodResolver(UpdateFlowSchema),
    defaultValues: {
      name: flow.name,
      meta: {
        description: (flow.meta as { description?: string } | null)
          ?.description,
        tags: tags,
      },
    },
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: UpdateFlowInput) => {
    try {
      const metaData: { description?: string; tags?: string[] } = {};
      if (data.meta?.description) {
        metaData.description = data.meta.description;
      }
      if (tags.length > 0) {
        metaData.tags = tags;
      }

      await updateFlow.mutateAsync({
        flowId: flow.id,
        data: {
          name: data.name,
          meta: Object.keys(metaData).length > 0 ? metaData : undefined,
        },
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Failed to update flow:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Flow</DialogTitle>
          <DialogDescription>
            Update the flow name, description, and tags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Flow Name</Label>
            <Input id="name" {...register("name")} placeholder="My Flow" />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              {...register("meta.description")}
              placeholder="A brief description of this flow"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (max 10)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag"
                disabled={tags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={tags.length >= 10 || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateFlow.isPending}>
              {updateFlow.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
