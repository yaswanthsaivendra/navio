import type { Flow, FlowStep } from "@/lib/generated/prisma/client";

export type FlowWithSteps = Flow & {
  steps: FlowStep[];
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type FlowListItem = Flow & {
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  steps: Array<{
    screenshotThumbUrl: string | null;
  }>;
};

export type FlowStepType =
  | "CLICK"
  | "NAVIGATION"
  | "INPUT"
  | "VISIBILITY"
  | "MANUAL";

export type FlowMeta = {
  description?: string;
  tags?: string[];
};

export type FlowStepMeta = {
  elementText?: string;
  nodeType?: string;
  timestamp?: string;
  clickCoordinates?: {
    x: number;
    y: number;
  };
  screenshotThumb?: string;
  screenshotFull?: string;
};
