"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TenantRole } from "@/lib/generated/prisma/client";
import { AppErrors } from "@/lib/errors";
import { requireOwner } from "@/lib/utils/permissions";

/**
 * Get all members of a tenant
 */
export async function getMembersByTenant(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Check if user has access to this tenant
  const userMembership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId,
      },
    },
  });

  if (!userMembership) {
    throw AppErrors.TENANT_ACCESS_DENIED;
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: {
      tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return memberships;
}

/**
 * Update a member's role
 * Only OWNER can change roles
 */
export async function updateMemberRole(
  membershipId: string,
  newRole: TenantRole
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Get the membership to update
  const membership = await prisma.tenantMembership.findUnique({
    where: { id: membershipId },
    include: {
      tenant: true,
    },
  });

  if (!membership) {
    throw AppErrors.MEMBERSHIP_NOT_FOUND;
  }

  // Check if current user is OWNER of this tenant
  await requireOwner(
    membership.tenantId,
    session.user.id,
    AppErrors.MEMBERSHIP_ROLE_UPDATE_FORBIDDEN
  );

  // Prevent changing own role
  if (membership.userId === session.user.id) {
    throw AppErrors.MEMBERSHIP_CANNOT_CHANGE_OWN_ROLE;
  }

  // Update the role
  const updated = await prisma.tenantMembership.update({
    where: { id: membershipId },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/team/members");
  return updated;
}

/**
 * Remove a member from a tenant
 * Only OWNER can remove members
 */
export async function removeMember(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  // Get the membership to remove
  const membership = await prisma.tenantMembership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw AppErrors.MEMBERSHIP_NOT_FOUND;
  }

  // Check if current user is OWNER of this tenant
  await requireOwner(
    membership.tenantId,
    session.user.id,
    AppErrors.MEMBERSHIP_REMOVE_FORBIDDEN
  );

  // Prevent removing self
  if (membership.userId === session.user.id) {
    throw AppErrors.MEMBERSHIP_CANNOT_REMOVE_SELF;
  }

  // Count total owners
  const ownerCount = await prisma.tenantMembership.count({
    where: {
      tenantId: membership.tenantId,
      role: "OWNER",
    },
  });

  // Prevent removing the last owner
  if (membership.role === "OWNER" && ownerCount <= 1) {
    throw AppErrors.MEMBERSHIP_CANNOT_REMOVE_LAST_OWNER;
  }

  await prisma.tenantMembership.delete({
    where: { id: membershipId },
  });

  revalidatePath("/dashboard/team/members");
  return { success: true };
}

/**
 * Leave a tenant (remove self)
 */
export async function leaveTenant(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw AppErrors.UNAUTHORIZED;
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId,
      },
    },
  });

  if (!membership) {
    throw AppErrors.MEMBERSHIP_NOT_MEMBER;
  }

  // Check if user is the last owner
  if (membership.role === "OWNER") {
    const ownerCount = await prisma.tenantMembership.count({
      where: {
        tenantId,
        role: "OWNER",
      },
    });

    if (ownerCount <= 1) {
      throw AppErrors.MEMBERSHIP_CANNOT_LEAVE_AS_LAST_OWNER;
    }
  }

  await prisma.tenantMembership.delete({
    where: { id: membership.id },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
