"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TenantRole } from "@/lib/generated/prisma/client";
import { AppErrors } from "@/lib/errors";
import { CreateInvitationSchema } from "@/lib/validations/invitation";
import { requireOwnerOrAdmin } from "@/lib/utils/permissions";

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
    throw AppErrors.UNAUTHORIZED;
  }

  // Validate input with Zod
  const validated = CreateInvitationSchema.parse({ tenantId, email, role });

  // Check if user has permission to invite (OWNER or ADMIN)
  await requireOwnerOrAdmin(
    validated.tenantId,
    session.user.id,
    AppErrors.INVITE_PERMISSION_DENIED
  );

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: existingUser.id,
          tenantId: validated.tenantId,
        },
      },
    });

    if (existingMembership) {
      throw AppErrors.INVITATION_ALREADY_MEMBER;
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email: validated.email,
      tenantId: validated.tenantId,
      status: "PENDING",
    },
  });

  if (existingInvitation) {
    throw AppErrors.INVITATION_ALREADY_SENT;
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email: validated.email,
      role: validated.role,
      tenantId: validated.tenantId,
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
  });

  if (!membership) {
    throw AppErrors.TENANT_ACCESS_DENIED;
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
    throw AppErrors.INVITATION_NOT_FOUND;
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
    throw AppErrors.INVITATION_EXPIRED;
  }

  if (invitation.status !== "PENDING") {
    if (invitation.status === "ACCEPTED") {
      throw AppErrors.INVITATION_ALREADY_ACCEPTED;
    }
    if (invitation.status === "DECLINED") {
      throw AppErrors.INVITATION_ALREADY_DECLINED;
    }
    // For EXPIRED status (shouldn't happen but handle it)
    throw AppErrors.INVITATION_EXPIRED;
  }

  return invitation;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw AppErrors.INVITATION_MUST_BE_SIGNED_IN;
  }

  const invitation = await getInvitationByToken(token);

  // Check if the signed-in user's email matches the invitation
  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw AppErrors.INVITATION_EMAIL_MISMATCH;
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
    throw AppErrors.MEMBERSHIP_ALREADY_MEMBER;
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
    throw AppErrors.UNAUTHORIZED;
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw AppErrors.INVITATION_NOT_FOUND;
  }

  // Check if user has permission (OWNER or ADMIN)
  await requireOwnerOrAdmin(
    invitation.tenantId,
    session.user.id,
    AppErrors.INVITATION_CANCEL_FORBIDDEN
  );

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
    throw AppErrors.UNAUTHORIZED;
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
    throw AppErrors.INVITATION_NOT_FOUND;
  }

  // Check if user has permission (OWNER or ADMIN)
  await requireOwnerOrAdmin(
    invitation.tenantId,
    session.user.id,
    AppErrors.INVITATION_RESEND_FORBIDDEN
  );

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
