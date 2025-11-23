"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TenantRole } from "@/lib/generated/prisma/client";

/**
 * Create a new invitation
 * Only OWNER and ADMIN can invite
 */
export async function createInvitation(
  tenantId: string,
  email: string,
  role: TenantRole = "MEMBER"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }

  // Check if user has permission to invite (OWNER or ADMIN)
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
    throw new Error("Only owners and admins can invite members");
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: existingUser.id,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new Error("This user is already a member of the organization");
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      tenantId,
      status: "PENDING",
    },
  });

  if (existingInvitation) {
    throw new Error("An invitation has already been sent to this email");
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      tenantId,
      invitedBy: session.user.id,
      expiresAt,
    },
    include: {
      tenant: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/team/invites");

  // Send invitation email
  try {
    const { sendInvitationEmail } = await import("@/lib/email");
    await sendInvitationEmail({
      to: invitation.email,
      invitedByName: invitation.inviter.name,
      organizationName: invitation.tenant.name,
      token: invitation.token,
      role: invitation.role,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    // Don't throw - invitation was created successfully
  }

  return invitation;
}

/**
 * Get all invitations for a tenant
 */
export async function getInvitationsByTenant(tenantId: string) {
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
  });

  if (!membership) {
    throw new Error("Access denied");
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      tenantId,
    },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations;
}

/**
 * Get invitation by token (public - no auth required)
 */
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      tenant: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    // Mark as expired if not already
    if (invitation.status === "PENDING") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }
    throw new Error("This invitation has expired");
  }

  if (invitation.status !== "PENDING") {
    throw new Error(
      `This invitation has already been ${invitation.status.toLowerCase()}`
    );
  }

  return invitation;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("You must be signed in to accept an invitation");
  }

  const invitation = await getInvitationByToken(token);

  // Check if the signed-in user's email matches the invitation
  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Check if user is already a member
  const existingMembership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId: invitation.tenantId,
      },
    },
  });

  if (existingMembership) {
    // Mark invitation as accepted anyway
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    throw new Error("You are already a member of this organization");
  }

  // Create membership and update invitation in a transaction
  await prisma.$transaction([
    prisma.tenantMembership.create({
      data: {
        userId: session.user.id,
        tenantId: invitation.tenantId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  revalidatePath("/dashboard");
  return { success: true, tenantId: invitation.tenantId };
}

/**
 * Decline an invitation
 */
export async function declineInvitation(token: string) {
  const invitation = await getInvitationByToken(token);

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "DECLINED" },
  });

  return { success: true };
}

/**
 * Cancel (delete) a pending invitation
 * Only OWNER and ADMIN can cancel
 */
export async function cancelInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Check if user has permission (OWNER or ADMIN)
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId: invitation.tenantId,
      },
    },
  });

  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    throw new Error("Only owners and admins can cancel invitations");
  }

  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  revalidatePath("/dashboard/team/invites");
  return { success: true };
}

/**
 * Resend an invitation (creates a new token and extends expiry)
 */
export async function resendInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      tenant: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Check if user has permission (OWNER or ADMIN)
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.user.id,
        tenantId: invitation.tenantId,
      },
    },
  });

  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    throw new Error("Only owners and admins can resend invitations");
  }

  // Update invitation with new token and expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: "PENDING",
      expiresAt,
      // Prisma will auto-generate a new token if we don't specify one
    },
    include: {
      tenant: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/team/invites");

  // Send invitation email
  try {
    const { sendInvitationEmail } = await import("@/lib/email");
    await sendInvitationEmail({
      to: updated.email,
      invitedByName: updated.inviter.name,
      organizationName: updated.tenant.name,
      token: updated.token,
      role: updated.role,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    // Don't throw - invitation was updated successfully
  }

  return updated;
}
