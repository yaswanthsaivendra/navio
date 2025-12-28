import { z } from "zod";

/**
 * Email validation schema using Zod's built-in email validation
 * Zod's email validation is more robust than regex and handles edge cases
 */
export const EmailSchema = z.string().email("Invalid email address");

/**
 * Tenant role schema (must match Prisma enum)
 */
export const TenantRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);

/**
 * Create invitation input schema
 */
export const CreateInvitationSchema = z.object({
  tenantId: z.string().cuid("Invalid tenant ID"),
  email: EmailSchema,
  role: TenantRoleSchema.default("MEMBER"),
});

/**
 * Accept invitation input schema
 */
export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Decline invitation input schema
 */
export const DeclineInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Cancel invitation input schema
 */
export const CancelInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

/**
 * Resend invitation input schema
 */
export const ResendInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

// Type exports
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;
export type DeclineInvitationInput = z.infer<typeof DeclineInvitationSchema>;
export type CancelInvitationInput = z.infer<typeof CancelInvitationSchema>;
export type ResendInvitationInput = z.infer<typeof ResendInvitationSchema>;
