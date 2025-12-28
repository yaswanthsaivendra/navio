"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MousePointerClick,
  ArrowRight,
  Keyboard,
  Eye,
  Hand,
  ExternalLink,
} from "lucide-react";
import type { FlowStep } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

type StepInfoPanelProps = {
  step: FlowStep;
  stepNumber: number;
  totalSteps: number;
};

const stepTypeConfig = {
  CLICK: {
    icon: MousePointerClick,
    label: "Click",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  NAVIGATION: {
    icon: ArrowRight,
    label: "Navigation",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  INPUT: {
    icon: Keyboard,
    label: "Input",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  VISIBILITY: {
    icon: Eye,
    label: "Visibility",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  MANUAL: {
    icon: Hand,
    label: "Manual",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
};

export default function StepInfoPanel({
  step,
  stepNumber,
  totalSteps,
}: StepInfoPanelProps) {
  const config = stepTypeConfig[step.type] || stepTypeConfig.MANUAL;
  const Icon = config.icon;
  const meta = step.meta as { timestamp?: string } | null;
  const timestamp = meta?.timestamp
    ? new Date(meta.timestamp).toLocaleString()
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {/* Step Counter and Explanation */}
      <div>
        <div className="text-muted-foreground mb-1 text-sm font-medium">
          Step {stepNumber} of {totalSteps}
        </div>
        <p className="text-lg font-medium">{step.explanation}</p>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Step Type */}
        <Badge className={cn("gap-1.5", config.className)}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>

        {/* URL */}
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <a
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="max-w-[200px] truncate">{step.url}</span>
          </a>
        </Button>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-muted-foreground text-xs">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
