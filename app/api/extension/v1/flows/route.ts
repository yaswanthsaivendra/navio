import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, AppErrors } from "@/lib/errors";
import { CreateFlowSchema } from "@/lib/validations/flow";
import { uploadFlowStepScreenshots } from "@/lib/utils/screenshot-upload";
import { withApiValidation } from "@/lib/middleware/api-validation";
import { createSuccessResponse } from "@/lib/utils/api-response";

/**
 * POST /api/extension/v1/flows
 * Create a new flow with steps (Extension API)
 * Requires: Valid JWT token in Authorization header
 */
export const POST = withApiValidation(
  {
    body: CreateFlowSchema,
    requireExtensionAuth: true,
    requireTenantAccess: true,
  },
  async (request: NextRequest, context) => {
    if (!context.extensionToken || !context.body) {
      throw AppErrors.UNAUTHORIZED;
    }

    const validated = context.body as z.infer<typeof CreateFlowSchema>;
    const { userId, tenantId } = context.extensionToken;

    // Validate step orders are unique
    const stepOrders = validated.steps.map(
      (step, index) => step.order ?? index
    );
    const uniqueOrders = new Set(stepOrders);
    if (stepOrders.length !== uniqueOrders.size) {
      throw new AppError(
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
            tenantId: tenantId,
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
    const stepsWithMeta = validated.steps.map((step, index) => ({
      id: steps[index].id,
      meta: step.meta,
    }));

    const uploadResults = await uploadFlowStepScreenshots(
      flow.id,
      stepsWithMeta
    );

    // PHASE 3: Update steps with screenshot URLs
    // Update only steps that had successful uploads
    await Promise.allSettled(
      uploadResults.map(async (uploadResult) => {
        const { stepId, screenshotThumbUrl, screenshotFullUrl } = uploadResult;

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
          } catch {
            // Non-critical - step exists, just without screenshot URLs
            // Error logging should be handled by logging system
          }
        }
      })
    );

    // Fetch updated steps with screenshot URLs
    const updatedSteps = await prisma.flowStep.findMany({
      where: { flowId: flow.id },
      orderBy: { order: "asc" },
    });

    // Return created flow with updated steps
    return createSuccessResponse({ ...flow, steps: updatedSteps }, 201);
  }
);
