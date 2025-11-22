"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TenantRole } from "@/lib/generated/prisma/client";

/**
 * Get all members of a tenant
 */
export async function getMembersByTenant(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
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
    throw new Error("Access denied");
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
    throw new Error("Unauthorized");
  }

  // Get the membership to update
  const membership = await prisma.tenantMembership.findUnique({
    where: { id: membershipId },
    include: {
      tenant: true,
    },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  // Check if current user is OWNER of this tenant
  const userMembership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId: membership.tenantId,
      },
    },
  });

  if (!userMembership || userMembership.role !== "OWNER") {
    throw new Error("Only the owner can change member roles");
  }

  // Prevent changing own role
  if (membership.userId === session.user.id) {
    throw new Error("You cannot change your own role");
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
    throw new Error("Unauthorized");
  }

  // Get the membership to remove
  const membership = await prisma.tenantMembership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  // Check if current user is OWNER of this tenant
  const userMembership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId: membership.tenantId,
      },
    },
  });

  if (!userMembership || userMembership.role !== "OWNER") {
    throw new Error("Only the owner can remove members");
  }

  // Prevent removing self
  if (membership.userId === session.user.id) {
    throw new Error("You cannot remove yourself from the organization");
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
    throw new Error("Cannot remove the last owner. Transfer ownership first.");
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
    throw new Error("Unauthorized");
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
    throw new Error("You are not a member of this organization");
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
      throw new Error(
        "Cannot leave as the last owner. Transfer ownership or delete the organization."
      );
    }
  }

  await prisma.tenantMembership.delete({
    where: { id: membership.id },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
