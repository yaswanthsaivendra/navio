"use client";

import { Lock, Globe, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BrowserMockupProps = {
  url: string;
  children: React.ReactNode;
  className?: string;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
};

/**
 * Formats a URL for display in the browser URL bar
 * Shows protocol, domain, and path in a user-friendly way
 */
function formatUrlForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    // Show full URL but truncate if too long
    const displayUrl = urlObj.href;
    return displayUrl.length > 70
      ? `${displayUrl.slice(0, 67)}...`
      : displayUrl;
  } catch {
    // If URL parsing fails, return as-is (truncated if needed)
    return url.length > 70 ? `${url.slice(0, 67)}...` : url;
  }
}

/**
 * Checks if URL is HTTPS
 */
function isSecure(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

export function BrowserMockup({
  url,
  children,
  className,
  onNavigateBack,
  onNavigateForward,
  canGoBack = false,
  canGoForward = false,
}: BrowserMockupProps) {
  const displayUrl = formatUrlForDisplay(url);
  const isHttps = isSecure(url);

  return (
    <div
      className={cn(
        "bg-background flex flex-col overflow-hidden rounded-lg border shadow-xl",
        className
      )}
    >
      {/* Browser Chrome */}
      <div className="bg-muted/30 flex h-12 items-center gap-2 border-b px-3 backdrop-blur-sm">
        {/* Browser Controls (macOS style) */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-[#28ca42] shadow-sm" />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onNavigateBack}
                disabled={!canGoBack || !onNavigateBack}
                className={cn(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-all",
                  "text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/80",
                  "disabled:hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  "active:scale-95"
                )}
                aria-label="Previous step"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Previous step</span>
                {canGoBack ? (
                  <span className="text-xs opacity-80">
                    Navigate to previous step
                  </span>
                ) : (
                  <span className="text-xs opacity-80">No previous step</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onNavigateForward}
                disabled={!canGoForward || !onNavigateForward}
                className={cn(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-all",
                  "text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/80",
                  "disabled:hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  "active:scale-95"
                )}
                aria-label="Next step"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Next step</span>
                {canGoForward ? (
                  <span className="text-xs opacity-80">
                    Navigate to next step
                  </span>
                ) : (
                  <span className="text-xs opacity-80">No next step</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-all",
                  "text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/80",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  "active:scale-95"
                )}
                aria-label="Refresh"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <span>Refresh (coming soon)</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* URL Bar */}
        <div className="bg-background border-border flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-1.5 shadow-sm">
          {/* Security Indicator */}
          <div className="shrink-0">
            {isHttps ? (
              <Lock className="text-muted-foreground h-3.5 w-3.5" />
            ) : (
              <Globe className="text-muted-foreground h-3.5 w-3.5" />
            )}
          </div>

          {/* URL Text */}
          <div className="text-muted-foreground min-w-0 flex-1 truncate text-xs font-medium">
            {displayUrl}
          </div>
        </div>

        {/* Spacer for alignment */}
        <div className="w-2 shrink-0" />
      </div>

      {/* Content Area */}
      <div className="relative overflow-auto bg-white">{children}</div>
    </div>
  );
}
