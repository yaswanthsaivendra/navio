import { prisma } from "@/lib/db";
import { AppError, AppErrors } from "@/lib/errors";
import type {
  TenantMembership,
  TenantRole,
} from "@/lib/generated/prisma/client";

/**
 * Get user's membership for a tenant
 * Throws if membership doesn't exist
 */
export async function getTenantMembership(
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

/**
 * Check if user has OWNER or ADMIN role in a tenant
 * Throws if user doesn't have access or doesn't have required role
 * @param error - Optional custom error to throw (defaults to TENANT_UPDATE_FORBIDDEN)
 */
export async function requireOwnerOrAdmin(
  tenantId: string,
  userId: string,
  error?: AppError
): Promise<TenantMembership> {
  const membership = await getTenantMembership(tenantId, userId);

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw error || AppErrors.TENANT_UPDATE_FORBIDDEN;
  }

  return membership;
}

/**
 * Check if user has OWNER role in a tenant
 * Throws if user doesn't have access or isn't OWNER
 * @param error - Optional custom error to throw (defaults to FORBIDDEN)
 */
export async function requireOwner(
  tenantId: string,
  userId: string,
  error?: AppError
): Promise<TenantMembership> {
  const membership = await getTenantMembership(tenantId, userId);

  if (membership.role !== "OWNER") {
    throw error || AppErrors.FORBIDDEN;
  }

  return membership;
}

/**
 * Check if a role is OWNER or ADMIN
 */
export function isOwnerOrAdmin(role: TenantRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if a role is OWNER
 */
export function isOwner(role: TenantRole): boolean {
  return role === "OWNER";
}
