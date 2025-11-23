"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new tenant (organization) and add the creator as OWNER
 */
export async function createTenant(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error("Organization name is required");
  }

  // Create tenant and membership in a transaction
  const tenant = await prisma.tenant.create({
    data: {
      name: name.trim(),
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
    throw new Error("Unauthorized");
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
    throw new Error("Unauthorized");
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
    throw new Error("Access denied");
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
    throw new Error("Unauthorized");
  }

  // Check if user has OWNER or ADMIN role
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId,
      },
    },
  });

  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    throw new Error("Only owners and admins can update organization settings");
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
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
    throw new Error("Unauthorized");
  }

  // Check if user is OWNER
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only the owner can delete the organization");
  }

  await prisma.tenant.delete({
    where: { id: tenantId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
