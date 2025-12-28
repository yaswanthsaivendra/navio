"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppErrors } from "@/lib/errors";
import {
  CreateTenantSchema,
  UpdateTenantSchema,
} from "@/lib/validations/tenant";
import { requireOwnerOrAdmin, requireOwner } from "@/lib/utils/permissions";

/**
 * Create a new tenant (organization) and add the creator as OWNER
 */
export async function createTenant(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Validate input with Zod
  const validated = CreateTenantSchema.parse({ name });

  // Create tenant and membership in a transaction
  const tenant = await prisma.tenant.create({
    data: {
      name: validated.name,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      memberships: true,
    },
  });

  revalidatePath("/dashboard");
  return tenant;
}

/**
 * Get all tenants for the current user
 */
export async function getTenantsByUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tenant: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  type MembershipWithTenant = Awaited<typeof memberships>[number];

  return memberships.map((m: MembershipWithTenant) => ({
    ...m.tenant,
    role: m.role,
    membershipId: m.id,
  }));
}

/**
 * Get a specific tenant by ID (with permission check)
 */
export async function getTenantById(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Check if user has access to this tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId,
      },
    },
    include: {
      tenant: true,
    },
  });

  if (!membership) {
    throw AppErrors.TENANT_ACCESS_DENIED;
  }

  return {
    ...membership.tenant,
    role: membership.role,
  };
}

/**
 * Update tenant details (name only)
 * Only OWNER and ADMIN can update
 */
export async function updateTenant(tenantId: string, data: { name?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Validate input with Zod
  const validated = UpdateTenantSchema.parse(data);

  // Check if user has OWNER or ADMIN role
  await requireOwnerOrAdmin(
    tenantId,
    session.user.id,
    AppErrors.TENANT_UPDATE_FORBIDDEN
  );

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: validated,
  });

  revalidatePath("/dashboard/settings/organization");
  return tenant;
}

/**
 * Delete a tenant (organization)
 * Only OWNER can delete
 */
export async function deleteTenant(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Check if user is OWNER
  await requireOwner(
    tenantId,
    session.user.id,
    AppErrors.TENANT_DELETE_FORBIDDEN
  );

  await prisma.tenant.delete({
    where: { id: tenantId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
