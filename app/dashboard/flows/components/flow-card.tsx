"use client";

import { useState } from "react";
import Link from "next/link";
import { R2Image } from "@/components/r2-image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  Calendar,
  User,
  MoreVertical,
  Eye,
  Edit,
  BarChart3,
  Trash2,
} from "lucide-react";
import type { FlowListItem } from "@/types/flow";
import DeleteFlowDialog from "./delete-flow-dialog";
// Date formatting helper
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
}

type FlowCardProps = {
  flow: FlowListItem;
};

export default function FlowCard({ flow }: FlowCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const meta = flow.meta as { tags?: string[]; description?: string } | null;
  const tags = meta?.tags || [];
  // Get thumbnail from first step
  const thumbnailUrl = flow.steps[0]?.screenshotThumbUrl ?? null;

  return (
    <>
      <Card className="hover:bg-muted/50 group transition-colors">
        <div className="relative">
          {/* Thumbnail */}
          <Link href={`/dashboard/flows/${flow.id}`} className="block">
            <div className="relative h-32 w-full overflow-hidden rounded-t-lg border-b">
              {thumbnailUrl ? (
                <R2Image
                  src={thumbnailUrl}
                  alt={flow.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  fallback={
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <Layers className="text-muted-foreground h-8 w-8" />
                    </div>
                  }
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <Layers className="text-muted-foreground h-8 w-8" />
                </div>
              )}
            </div>
          </Link>

          {/* Menu Button - Top Right Corner */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted/80 hover:text-foreground absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label="Flow actions menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/flows/${flow.id}`}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/flows/${flow.id}/edit`}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/flows/${flow.id}/analytics`}
                  className="cursor-pointer"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Card Content */}
        <CardContent className="p-3">
          <Link href={`/dashboard/flows/${flow.id}`}>
            <div className="hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
              {flow.name}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 truncate">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {flow.creator.name || flow.creator.email}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatRelativeTime(new Date(flow.createdAt))}
              </span>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-muted-foreground text-xs">
                    +{tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </Link>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteFlowDialog
        flow={flow}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
