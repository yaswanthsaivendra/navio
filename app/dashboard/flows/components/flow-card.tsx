"use client";

import Link from "next/link";
import { R2Image } from "@/components/r2-image";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Calendar, User } from "lucide-react";
import type { FlowListItem } from "@/types/flow";
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
  viewMode: "grid" | "list";
};

export default function FlowCard({ flow, viewMode }: FlowCardProps) {
  const meta = flow.meta as { tags?: string[]; description?: string } | null;
  const tags = meta?.tags || [];
  // Get thumbnail from first step (only first step is fetched for list view)
  const thumbnailUrl = flow.steps[0]?.screenshotThumbUrl ?? null;

  if (viewMode === "list") {
    return (
      <Card className="hover:bg-muted/50 transition-colors">
        <Link href={`/dashboard/flows/${flow.id}`}>
          <CardContent className="flex items-center gap-4 pt-6">
            {/* Content - no thumbnail in list view */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="hover:text-primary font-semibold transition-colors">
                    {flow.name}
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {flow.creator.name || flow.creator.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(new Date(flow.createdAt))}
                    </span>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-muted-foreground text-xs">
                          +{tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:bg-muted/50 group transition-colors">
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
        <CardContent className="p-3">
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
        </CardContent>
      </Link>
    </Card>
  );
}
