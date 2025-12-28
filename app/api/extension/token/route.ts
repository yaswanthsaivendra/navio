import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { verifyTenantAccess } from "@/lib/utils/flow-auth";
import { AppError, AppErrors } from "@/lib/errors";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";

/**
 * POST /api/extension/token
 * Generate JWT token for browser extension
 * Requires: User must be logged in via NextAuth
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return createErrorResponse(AppErrors.UNAUTHORIZED);
    }

    // Get active tenant
    const activeTenant = await getActiveTenant();
    if (!activeTenant) {
      return createErrorResponse(
        new AppError("No active tenant", "NO_ACTIVE_TENANT", 400)
      );
    }

    // Verify user has access to tenant
    await verifyTenantAccess(activeTenant.id, session.user.id);

    // Generate JWT token (valid for 48 hours)
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    );

    if (!secret) {
      return createErrorResponse(
        new AppError("Server configuration error", "CONFIG_ERROR", 500)
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours

    const token = await new SignJWT({
      userId: session.user.id,
      tenantId: activeTenant.id,
      email: session.user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(secret);

    return createSuccessResponse({
      token,
      expiresAt: expiresAt.toISOString(),
      tenantId: activeTenant.id,
      tenantName: activeTenant.name,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
