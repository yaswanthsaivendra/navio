import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { verifyTenantAccess } from "@/lib/utils/flow-auth";
import { FlowError, FlowErrors, formatErrorResponse } from "@/lib/errors";

/**
 * POST /api/extension/token
 * Generate JWT token for browser extension
 * Requires: User must be logged in via NextAuth
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(formatErrorResponse(FlowErrors.UNAUTHORIZED), {
        status: 401,
      });
    }

    // Get active tenant
    const activeTenant = await getActiveTenant();
    if (!activeTenant) {
      return NextResponse.json(
        formatErrorResponse(
          new FlowError("No active tenant", "NO_ACTIVE_TENANT", 400)
        ),
        { status: 400 }
      );
    }

    // Verify user has access to tenant
    await verifyTenantAccess(activeTenant.id, session.user.id);

    // Generate JWT token (valid for 48 hours)
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    );

    if (!secret) {
      return NextResponse.json(
        formatErrorResponse(
          new FlowError("Server configuration error", "CONFIG_ERROR", 500)
        ),
        { status: 500 }
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

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      tenantId: activeTenant.id,
      tenantName: activeTenant.name,
    });
  } catch (error) {
    if (error instanceof FlowError) {
      return NextResponse.json(formatErrorResponse(error), {
        status: error.statusCode,
      });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
