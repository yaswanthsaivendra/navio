import { z } from "zod";

export const FlowStepTypeSchema = z.enum([
  "CLICK",
  "NAVIGATION",
  "INPUT",
  "VISIBILITY",
  "MANUAL",
]);

export const FlowStepMetaSchema = z.object({
  elementText: z.string().optional(),
  nodeType: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  clickCoordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  screenshotThumb: z.string().optional(), // Base64 data URL
  screenshotFull: z.string().optional(), // Base64 data URL for full screenshot
});

export const FlowStepSchema = z.object({
  id: z.string().cuid().optional(),
  type: FlowStepTypeSchema,
  url: z.string().url(),
  explanation: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
  meta: FlowStepMetaSchema.optional(),
});

export const FlowMetaSchema = z.object({
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const CreateFlowSchema = z.object({
  name: z.string().min(1).max(100),
  steps: z.array(FlowStepSchema).min(1),
  meta: FlowMetaSchema.optional(),
});

export const UpdateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  meta: FlowMetaSchema.optional(),
});

export const CreateFlowStepSchema = z.object({
  type: FlowStepTypeSchema,
  url: z.string().url(),
  explanation: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
  meta: FlowStepMetaSchema.optional(),
});

export const UpdateFlowStepSchema = z.object({
  explanation: z.string().min(1).max(200).optional(),
  order: z.number().int().nonnegative().optional(),
  meta: FlowStepMetaSchema.optional(),
});

// Type exports for use in server actions
export type FlowStepType = z.infer<typeof FlowStepTypeSchema>;
export type FlowStepMeta = z.infer<typeof FlowStepMetaSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type FlowMeta = z.infer<typeof FlowMetaSchema>;
export type CreateFlowInput = z.infer<typeof CreateFlowSchema>;
export type UpdateFlowInput = z.infer<typeof UpdateFlowSchema>;
export type CreateFlowStepInput = z.infer<typeof CreateFlowStepSchema>;
export type UpdateFlowStepInput = z.infer<typeof UpdateFlowStepSchema>;
