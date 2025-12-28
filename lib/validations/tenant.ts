import { z } from "zod";

/**
 * Tenant name validation schema
 * Max length of 255 characters (reasonable limit for organization names)
 */
export const TenantNameSchema = z
  .string()
  .min(1, "Organization name is required")
  .max(255, "Organization name must be 255 characters or less")
  .trim();

/**
 * Create tenant input schema
 */
export const CreateTenantSchema = z.object({
  name: TenantNameSchema,
});

/**
 * Update tenant input schema
 */
export const UpdateTenantSchema = z.object({
  name: TenantNameSchema.optional(),
});

// Type exports
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
