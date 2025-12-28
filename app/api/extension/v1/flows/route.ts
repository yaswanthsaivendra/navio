import { NextResponse } from "next/server";
import { validateExtensionToken } from "@/lib/middleware/extension-auth";
import { prisma } from "@/lib/db";
import { FlowError, formatErrorResponse } from "@/lib/errors";
import { CreateFlowSchema } from "@/lib/validations/flow";
import { verifyTenantAccess } from "@/lib/utils/flow-auth";
import {
  uploadScreenshot,
  generateScreenshotKey,
  base64ToBuffer,
} from "@/lib/storage";

/**
 * POST /api/extension/v1/flows
 * Create a new flow with steps (Extension API)
 * Requires: Valid JWT token in Authorization header
 */
export async function POST(request: Request) {
  try {
    // Validate authentication
    const authHeader = request.headers.get("authorization");
    const tokenPayload = await validateExtensionToken(authHeader);

    // Verify user still has access to tenant (in case membership was revoked)
    await verifyTenantAccess(tokenPayload.tenantId, tokenPayload.userId);

    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new FlowError("Invalid JSON", "INVALID_JSON", 400);
    });

    // Validate input with Zod
    const validated = CreateFlowSchema.parse(body);

    // Validate step orders are unique
    const stepOrders = validated.steps.map(
      (step, index) => step.order ?? index
    );
    const uniqueOrders = new Set(stepOrders);
    if (stepOrders.length !== uniqueOrders.size) {
      return NextResponse.json(
        formatErrorResponse(
          new FlowError(
            "Step orders must be unique. Multiple steps cannot have the same order value.",
            "DUPLICATE_STEP_ORDER",
            400
          )
        ),
        { status: 400 }
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
            tenantId: tokenPayload.tenantId,
            createdBy: tokenPayload.userId,
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
          const { stepId, screenshotThumbUrl, screenshotFullUrl } =
            result.value;

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
                  error:
                    error instanceof Error ? error.message : "Unknown error",
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

    // Return created flow with updated steps
    return NextResponse.json({ ...flow, steps: updatedSteps }, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            statusCode: 400,
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Handle FlowError
    if (error instanceof FlowError) {
      return NextResponse.json(formatErrorResponse(error), {
        status: error.statusCode,
      });
    }

    // Handle unknown errors
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
