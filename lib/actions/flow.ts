"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FlowError, FlowErrors } from "@/lib/errors";
import {
  CreateFlowSchema,
  UpdateFlowSchema,
  type CreateFlowInput,
  type UpdateFlowInput,
} from "@/lib/validations/flow";
import { getActiveTenant } from "./active-tenant";
import { verifyTenantAccess } from "@/lib/utils/flow-auth";
import {
  canModifyFlow,
  canDeleteFlow,
  verifyFlowAccess,
} from "@/lib/utils/flow-auth";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  uploadScreenshot,
  generateScreenshotKey,
  base64ToBuffer,
  deleteScreenshot,
  extractKeyFromUrl,
} from "@/lib/storage";

/**
 * Get all flows for the active tenant
 */
export async function getFlows(filters?: {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  const activeTenant = await getActiveTenant();
  if (!activeTenant) {
    throw new Error("No active tenant");
  }

  const where: Prisma.FlowWhereInput = {
    tenantId: activeTenant.id,
  };

  // Filter by tags if provided
  if (filters?.tags && filters.tags.length > 0) {
    where.meta = {
      path: ["tags"],
      array_contains: filters.tags,
    } as Prisma.JsonNullableFilter<"Flow">;
  }

  // Search by name if provided
  if (filters?.search) {
    where.name = {
      contains: filters.search,
      mode: "insensitive",
    };
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const [flows, total] = await Promise.all([
    prisma.flow.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        steps: {
          take: 1,
          orderBy: {
            order: "asc",
          },
          select: {
            screenshotThumbUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
    prisma.flow.count({ where }),
  ]);

  return {
    flows,
    total,
    limit,
    offset,
  };
}

/**
 * Get flow by ID (with permission check)
 */
export async function getFlowById(flowId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  await verifyFlowAccess(flowId, session.user.id);

  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      steps: {
        orderBy: {
          order: "asc",
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!flow) {
    return null;
  }

  // Normalize screenshot URLs (replace placeholder domains with actual R2 URLs)
  const { normalizeR2Url } = await import("@/lib/utils/r2-url");
  const normalizedSteps = flow.steps.map((step) => ({
    ...step,
    screenshotThumbUrl: step.screenshotThumbUrl
      ? normalizeR2Url(step.screenshotThumbUrl)
      : null,
    screenshotFullUrl: step.screenshotFullUrl
      ? normalizeR2Url(step.screenshotFullUrl)
      : null,
  }));

  return {
    ...flow,
    steps: normalizedSteps,
  };
}

/**
 * Create a new flow
 */
export async function createFlow(data: CreateFlowInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Validate input
  const validated = CreateFlowSchema.parse(data);

  const activeTenant = await getActiveTenant();
  if (!activeTenant) {
    throw new Error("No active tenant");
  }

  // Verify user has access to tenant
  const userId = session.user.id;
  await verifyTenantAccess(activeTenant.id, userId);

  // Validate step orders are unique
  const stepOrders = validated.steps.map((step, index) => step.order ?? index);
  const uniqueOrders = new Set(stepOrders);
  if (stepOrders.length !== uniqueOrders.size) {
    throw new FlowError(
      "Step orders must be unique. Multiple steps cannot have the same order value.",
      "DUPLICATE_STEP_ORDER",
      400
    );
  }

  // PHASE 1: Create flow and steps in transaction (DB operations only)
  // This is fast and reliable - no external API calls
  // Using sequential creation (industry best practice) to avoid lock contention
  const { flow, steps } = await prisma.$transaction(
    async (tx) => {
      const createdFlow = await tx.flow.create({
        data: {
          name: validated.name,
          tenantId: activeTenant.id,
          createdBy: userId,
          meta: validated.meta || undefined,
        },
      });

      // Create steps sequentially (best practice for transactions)
      // Sequential operations avoid lock contention and are more reliable
      const createdSteps = [];
      for (const [index, step] of validated.steps.entries()) {
        const createdStep = await tx.flowStep.create({
          data: {
            flowId: createdFlow.id,
            type: step.type,
            url: step.url,
            explanation: step.explanation,
            order: step.order ?? index,
            meta: step.meta || undefined,
            // Screenshot URLs will be null initially, updated after uploads
            screenshotThumbUrl: null,
            screenshotFullUrl: null,
          },
        });
        createdSteps.push(createdStep);
      }

      return { flow: createdFlow, steps: createdSteps };
    },
    {
      // Safety timeout: 10 seconds (should complete in < 1 second for typical flows)
      maxWait: 10000,
      timeout: 10000,
    }
  );

  // PHASE 2: Upload screenshots OUTSIDE transaction (external API calls)
  // This happens after DB transaction commits, so flow exists even if uploads fail
  const uploadResults = await Promise.allSettled(
    validated.steps.map(async (step, index) => {
      const stepId = steps[index].id;
      const uploads: {
        screenshotThumbUrl: string | null;
        screenshotFullUrl: string | null;
      } = {
        screenshotThumbUrl: null,
        screenshotFullUrl: null,
      };

      // Upload thumbnail if present
      if (step.meta?.screenshotThumb) {
        try {
          const { buffer, contentType } = base64ToBuffer(
            step.meta.screenshotThumb as string
          );
          const key = generateScreenshotKey(
            flow.id,
            stepId,
            "thumb",
            contentType.includes("jpeg") ? "jpg" : "png"
          );
          uploads.screenshotThumbUrl = await uploadScreenshot(
            key,
            buffer,
            contentType
          );
        } catch (error) {
          console.error(`Failed to upload thumbnail for step ${stepId}:`, {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Continue - step will exist without thumbnail
        }
      }

      // Upload full screenshot if present
      if (step.meta?.screenshotFull) {
        try {
          const { buffer, contentType } = base64ToBuffer(
            step.meta.screenshotFull as string
          );
          const key = generateScreenshotKey(
            flow.id,
            stepId,
            "full",
            contentType.includes("jpeg") ? "jpg" : "png"
          );
          uploads.screenshotFullUrl = await uploadScreenshot(
            key,
            buffer,
            contentType
          );
        } catch (error) {
          console.error(
            `Failed to upload full screenshot for step ${stepId}:`,
            {
              error: error instanceof Error ? error.message : "Unknown error",
            }
          );
          // Continue - step will exist without full screenshot
        }
      }

      return { stepId, ...uploads };
    })
  );

  // PHASE 3: Update steps with screenshot URLs
  // Update only steps that had successful uploads
  await Promise.allSettled(
    uploadResults.map(async (result) => {
      if (result.status === "fulfilled") {
        const { stepId, screenshotThumbUrl, screenshotFullUrl } = result.value;

        // Only update if we have at least one screenshot URL
        if (screenshotThumbUrl || screenshotFullUrl) {
          try {
            await prisma.flowStep.update({
              where: { id: stepId },
              data: {
                screenshotThumbUrl,
                screenshotFullUrl,
              },
            });
          } catch (error) {
            console.error(
              `Failed to update step ${stepId} with screenshot URLs:`,
              {
                error: error instanceof Error ? error.message : "Unknown error",
              }
            );
            // Non-critical - step exists, just without screenshot URLs
          }
        }
      }
    })
  );

  // Fetch updated steps with screenshot URLs
  const updatedSteps = await prisma.flowStep.findMany({
    where: { flowId: flow.id },
    orderBy: { order: "asc" },
  });

  const flowWithSteps = { ...flow, steps: updatedSteps };

  revalidatePath("/dashboard");
  return flowWithSteps;
}

/**
 * Update flow metadata
 */
export async function updateFlow(flowId: string, data: UpdateFlowInput) {
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
  const validated = UpdateFlowSchema.parse(data);

  const flow = await prisma.flow.update({
    where: { id: flowId },
    data: {
      ...(validated.name && { name: validated.name }),
      ...(validated.meta !== undefined && {
        meta: validated.meta || undefined,
      }),
    },
    include: {
      steps: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return flow;
}

/**
 * Delete a flow (cascades to steps)
 */
export async function deleteFlow(flowId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw FlowErrors.UNAUTHORIZED;
  }

  // Check if user can delete this flow
  const canDelete = await canDeleteFlow(flowId, session.user.id);
  if (!canDelete) {
    throw FlowErrors.FORBIDDEN;
  }

  // Get flow with steps to delete screenshots
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: { steps: true },
  });

  // Delete screenshots from R2
  if (flow) {
    for (const step of flow.steps) {
      if (step.screenshotThumbUrl) {
        const key = extractKeyFromUrl(step.screenshotThumbUrl);
        if (key) await deleteScreenshot(key);
      }
      if (step.screenshotFullUrl) {
        const key = extractKeyFromUrl(step.screenshotFullUrl);
        if (key) await deleteScreenshot(key);
      }
    }
  }

  await prisma.flow.delete({
    where: { id: flowId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
