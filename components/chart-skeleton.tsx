"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CardContent, CardHeader } from "@/components/ui/card";

interface ChartSkeletonProps {
  className?: string;
  showHeader?: boolean;
}

/**
 * Skeleton loader for charts with proper structure
 */
export function ChartSkeleton({
  className,
  showHeader = true,
}: ChartSkeletonProps) {
  return (
    <div className={className} role="status" aria-label="Loading chart data">
      {showHeader && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Chart area skeleton */}
        <div className="relative h-[300px] w-full">
          {/* Y-axis skeleton */}
          <div className="absolute top-0 left-0 flex h-full flex-col justify-between pr-2 pb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-8" />
            ))}
          </div>
          {/* Chart lines skeleton */}
          <div className="ml-12 flex h-full items-end justify-between gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              // Use a deterministic pattern instead of random for consistent rendering
              const heights = [45, 60, 35, 70, 50, 55, 40, 65, 45, 75, 50, 60];
              return (
                <Skeleton
                  key={i}
                  className="w-full"
                  style={{
                    height: `${heights[i % heights.length]}%`,
                  }}
                />
              );
            })}
          </div>
          {/* X-axis skeleton */}
          <div className="absolute right-0 bottom-0 left-12 flex justify-between pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </div>
        {/* Legend skeleton */}
        <div className="flex items-center justify-center gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <span className="sr-only">Loading chart data...</span>
    </div>
  );
}
