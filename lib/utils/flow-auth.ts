"use server";

import { prisma } from "@/lib/db";
import { AppErrors } from "@/lib/errors";
import type { Flow, TenantMembership } from "@/lib/generated/prisma/client";

/**
 * Verify that a user has access to a flow's tenant
 * Returns the flow and membership if access is granted
 */
export async function verifyFlowAccess(
  flowId: string,
  userId: string
): Promise<{ flow: Flow; membership: TenantMembership }> {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      tenant: true,
    },
  });

  if (!flow) {
    throw AppErrors.FLOW_NOT_FOUND;
  }

  // Check if user has membership in the flow's tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId: flow.tenantId,
      },
    },
  });

  if (!membership) {
    throw AppErrors.TENANT_ACCESS_DENIED;
  }

  return { flow, membership };
}

/**
 * Check if a user can modify a flow
 * OWNER/ADMIN: can modify any flow in tenant
 * MEMBER: can only modify flows they created
 */
export async function canModifyFlow(
  flowId: string,
  userId: string
): Promise<boolean> {
  const { flow, membership } = await verifyFlowAccess(flowId, userId);

  // OWNER and ADMIN can modify any flow
  if (membership.role === "OWNER" || membership.role === "ADMIN") {
    return true;
  }

  // MEMBER can only modify flows they created
  return flow.createdBy === userId;
}

/**
 * Check if a user can delete a flow
 * OWNER/ADMIN: can delete any flow in tenant
 * MEMBER: can only delete flows they created
 */
export async function canDeleteFlow(
  flowId: string,
  userId: string
): Promise<boolean> {
  return canModifyFlow(flowId, userId);
}

/**
 * Verify user has access to a tenant
 */
export async function verifyTenantAccess(
  tenantId: string,
  userId: string
): Promise<TenantMembership> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  });

  if (!membership) {
    throw AppErrors.TENANT_ACCESS_DENIED;
  }

  return membership;
}
