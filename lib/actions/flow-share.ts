"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppErrors } from "@/lib/errors";
import { verifyFlowAccess, canModifyFlow } from "@/lib/utils/flow-auth";
import { randomBytes } from "crypto";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Generate a cryptographically secure share token
 */
export async function generateShareToken(): Promise<string> {
  // Generate 32 random bytes and convert to base64url (URL-safe)
  const bytes = randomBytes(32);
  return `share_${bytes.toString("base64url")}`;
}

/**
 * Create a share link within a transaction (internal use)
 * Used for auto-generation during flow creation
 */
export async function createFlowShareInTransaction(
  tx: Prisma.TransactionClient,
  flowId: string,
  createdBy: string
) {
  const shareToken = await generateShareToken();
  return await tx.flowShare.create({
    data: {
      flowId,
      shareToken,
      createdBy,
    },
  });
}

/**
 * Create or regenerate a share link for a flow
 */
export async function createFlowShare(flowId: string) {
  // Validate flowId format
  if (!flowId || typeof flowId !== "string" || flowId.length < 1) {
    throw AppErrors.FLOW_NOT_FOUND;
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Verify access and check if user can modify
  await verifyFlowAccess(flowId, session.user.id);
  const canModify = await canModifyFlow(flowId, session.user.id);
  if (!canModify) {
    throw AppErrors.FORBIDDEN;
  }

  // Generate new token
  const shareToken = await generateShareToken();

  // Use transaction to ensure atomicity
  const share = await prisma.$transaction(async (tx) => {
    // Check if share already exists
    const existingShare = await tx.flowShare.findUnique({
      where: { flowId },
    });

    if (existingShare) {
      // Update existing share (regenerate token = revoke old link)
      return await tx.flowShare.update({
        where: { flowId },
        data: {
          shareToken,
          viewCount: 0, // Reset view count when regenerating
        },
      });
    } else {
      // Create new share
      return await tx.flowShare.create({
        data: {
          flowId,
          shareToken,
          createdBy: session.user.id,
        },
      });
    }
  });

  revalidatePath(`/dashboard/flows/${flowId}`);
  return share;
}

/**
 * Delete (revoke) a share link
 */
export async function deleteFlowShare(flowId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Verify access and check if user can modify
  await verifyFlowAccess(flowId, session.user.id);
  const canModify = await canModifyFlow(flowId, session.user.id);
  if (!canModify) {
    throw AppErrors.FORBIDDEN;
  }

  await prisma.flowShare.delete({
    where: { flowId },
  });

  revalidatePath(`/dashboard/flows/${flowId}`);
}

/**
 * Get share link for a flow
 * Auto-creates share link if it doesn't exist (lazy generation for existing flows)
 */
export async function getFlowShare(flowId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Verify access
  await verifyFlowAccess(flowId, session.user.id);

  // Check if share exists
  let share = await prisma.flowShare.findUnique({
    where: { flowId },
  });

  // Auto-create if missing (lazy generation for existing flows)
  if (!share) {
    const shareToken = await generateShareToken();
    share = await prisma.flowShare.create({
      data: {
        flowId,
        shareToken,
        createdBy: session.user.id,
      },
    });
    revalidatePath(`/dashboard/flows/${flowId}`);
  }

  return share;
}

/**
 * Get public flow by share token (no auth required)
 * Uses atomic increment to prevent race conditions
 */
export async function getPublicFlowByShareToken(shareToken: string) {
  // Validate token format
  if (!shareToken || typeof shareToken !== "string" || shareToken.length < 10) {
    return null;
  }
  // Use transaction to fetch and increment atomically
  // Increased timeout for public access (may have slower DB connections)
  const share = await prisma.$transaction(
    async (tx) => {
      const foundShare = await tx.flowShare.findUnique({
        where: { shareToken },
        include: {
          flow: {
            include: {
              steps: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      });

      if (!foundShare) {
        return null;
      }

      // Atomic increment (prevents race conditions)
      await tx.flowShare.update({
        where: { id: foundShare.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return foundShare;
    },
    {
      maxWait: 10000, // 10 seconds max wait for transaction
      timeout: 15000, // 15 seconds timeout (increased for public access)
    }
  );

  return share;
}
