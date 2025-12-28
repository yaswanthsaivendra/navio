"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FlowErrors } from "@/lib/errors";
import {
  CreateFlowStepSchema,
  UpdateFlowStepSchema,
  type CreateFlowStepInput,
  type UpdateFlowStepInput,
} from "@/lib/validations/flow";
import { verifyFlowAccess, canModifyFlow } from "@/lib/utils/flow-auth";
import { deleteScreenshot, extractKeyFromUrl } from "@/lib/storage";
import { FlowError } from "@/lib/errors";

/**
 * Get all steps for a flow
 */
export async function getFlowSteps(flowId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Verify access to flow
  await verifyFlowAccess(flowId, session.user.id);

  return prisma.flowStep.findMany({
    where: { flowId },
    orderBy: {
      order: "asc",
    },
  });
}

/**
 * Create a new step in a flow
 */
export async function createFlowStep(
  flowId: string,
  data: CreateFlowStepInput
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Check if user can modify this flow
  const canModify = await canModifyFlow(flowId, session.user.id);
  if (!canModify) {
    throw FlowErrors.FORBIDDEN;
  }

  // Validate input
  const validated = CreateFlowStepSchema.parse(data);

  // Get current max order to set default if not provided
  const maxOrder = await prisma.flowStep.findFirst({
    where: { flowId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let order = validated.order ?? (maxOrder ? maxOrder.order + 1 : 0);

  // Check if order already exists (handle concurrent creation)
  const existingStep = await prisma.flowStep.findFirst({
    where: {
      flowId,
      order,
    },
  });

  if (existingStep) {
    // Auto-adjust: use next available order
    order = (maxOrder?.order ?? -1) + 1;
    console.warn(
      `Step order ${validated.order} already exists for flow ${flowId}. Using adjusted order ${order}.`
    );
  }

  const step = await prisma.flowStep.create({
    data: {
      flowId,
      type: validated.type,
      url: validated.url,
      explanation: validated.explanation,
      order,
      meta: validated.meta || undefined,
    },
  });

  revalidatePath("/dashboard");
  return step;
}

/**
 * Update a flow step
 */
export async function updateFlowStep(
  stepId: string,
  data: UpdateFlowStepInput
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Get step to find flow
  const step = await prisma.flowStep.findUnique({
    where: { id: stepId },
    select: { flowId: true },
  });

  if (!step) {
    throw FlowErrors.STEP_NOT_FOUND;
  }

  // Check if user can modify this flow
  const canModify = await canModifyFlow(step.flowId, session.user.id);
  if (!canModify) {
    throw FlowErrors.FORBIDDEN;
  }

  // Validate input
  const validated = UpdateFlowStepSchema.parse(data);

  const updatedStep = await prisma.flowStep.update({
    where: { id: stepId },
    data: {
      ...(validated.explanation && { explanation: validated.explanation }),
      ...(validated.order !== undefined && { order: validated.order }),
      ...(validated.meta !== undefined && {
        meta: validated.meta || undefined,
      }),
    },
  });

  revalidatePath("/dashboard");
  return updatedStep;
}

/**
 * Delete a flow step
 */
export async function deleteFlowStep(stepId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Get step to find flow
  const step = await prisma.flowStep.findUnique({
    where: { id: stepId },
    select: { flowId: true },
  });

  if (!step) {
    throw FlowErrors.STEP_NOT_FOUND;
  }

  // Check if user can modify this flow
  const canModify = await canModifyFlow(step.flowId, session.user.id);
  if (!canModify) {
    throw FlowErrors.FORBIDDEN;
  }

  // Get step to delete screenshots
  const stepToDelete = await prisma.flowStep.findUnique({
    where: { id: stepId },
    select: {
      screenshotThumbUrl: true,
      screenshotFullUrl: true,
    },
  });

  // Delete screenshots from R2
  if (stepToDelete) {
    if (stepToDelete.screenshotThumbUrl) {
      const key = extractKeyFromUrl(stepToDelete.screenshotThumbUrl);
      if (key) await deleteScreenshot(key);
    }
    if (stepToDelete.screenshotFullUrl) {
      const key = extractKeyFromUrl(stepToDelete.screenshotFullUrl);
      if (key) await deleteScreenshot(key);
    }
  }

  await prisma.flowStep.delete({
    where: { id: stepId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Reorder flow steps
 */
export async function reorderFlowSteps(flowId: string, stepIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Check if user can modify this flow
  const canModify = await canModifyFlow(flowId, session.user.id);
  if (!canModify) {
    throw FlowErrors.FORBIDDEN;
  }

  // Validate input
  if (!Array.isArray(stepIds) || stepIds.length === 0) {
    throw new FlowError(
      "Step IDs array is required and cannot be empty",
      "INVALID_STEP_IDS",
      400
    );
  }

  // Check for duplicate step IDs
  const uniqueStepIds = new Set(stepIds);
  if (stepIds.length !== uniqueStepIds.size) {
    throw new FlowError(
      "Duplicate step IDs found. Each step can only appear once in the reorder list.",
      "DUPLICATE_STEP_IDS",
      400
    );
  }

  // Verify all steps belong to this flow
  const steps = await prisma.flowStep.findMany({
    where: {
      id: { in: stepIds },
      flowId,
    },
  });

  if (steps.length !== stepIds.length) {
    throw new FlowError(
      `Some steps not found or don't belong to this flow. Expected ${stepIds.length} steps, found ${steps.length}.`,
      "INVALID_STEP_ORDER",
      400
    );
  }

  // Update order in a transaction
  await prisma.$transaction(
    stepIds.map((stepId, index) =>
      prisma.flowStep.update({
        where: { id: stepId },
        data: { order: index },
      })
    )
  );

  revalidatePath("/dashboard");
  return { success: true };
}
