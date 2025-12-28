"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateFlow } from "@/hooks/use-flows";
import { cn } from "@/lib/utils";

type InlineEditableTitleProps = {
  flowId: string;
  initialName: string;
  className?: string;
};

export default function InlineEditableTitle({
  flowId,
  initialName,
  className,
}: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateFlow = useUpdateFlow();

  // Derive displayed name: use editedName when editing, otherwise use initialName
  const displayName = isEditing ? editedName : initialName;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditedName(initialName);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setIsEditing(false);
      return;
    }

    if (trimmedName === initialName) {
      setIsEditing(false);
      return;
    }

    try {
      await updateFlow.mutateAsync({
        flowId,
        data: { name: trimmedName },
      });
      setIsEditing(false);
    } catch (error) {
      // On error, revert to original name
      setIsEditing(false);
      console.error("Failed to update flow name:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={inputRef}
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-xl font-semibold"
          disabled={updateFlow.isPending}
          maxLength={100}
        />
        {updateFlow.isPending && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("group flex items-center gap-2", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h1 className="truncate text-xl font-semibold">{displayName}</h1>
      <button
        onClick={handleStartEdit}
        className={cn(
          "shrink-0 rounded p-1 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0",
          "hover:bg-muted"
        )}
        aria-label="Edit flow name"
        title="Edit flow name"
      >
        <Pencil className="text-muted-foreground h-3.5 w-3.5" />
      </button>
    </div>
  );
}
