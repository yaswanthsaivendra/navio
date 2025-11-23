"use server";

import { auth } from "@/lib/auth";
import { getTenantsByUser } from "@/lib/actions/tenant";
import { cookies } from "next/headers";

/**
 * Get the active tenant for the current user
 * Uses cookie to store the active tenant ID
 */
export async function getActiveTenant() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const tenants = await getTenantsByUser();
  if (tenants.length === 0) {
    return null;
  }

  // Get active tenant from cookie
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active-tenant-id")?.value;

  // Find the tenant
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  // If not found or invalid, return first tenant
  return activeTenant || tenants[0];
}

/**
 * Switch the active tenant
 */
export async function switchTenant(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this tenant
  const tenants = await getTenantsByUser();
  const tenant = tenants.find((t) => t.id === tenantId);

  if (!tenant) {
    throw new Error("Access denied");
  }

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set("active-tenant-id", tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return tenant;
}
