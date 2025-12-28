import { jwtVerify } from "jose";
import { FlowErrors } from "@/lib/errors";

/**
 * Extension token payload structure
 * Contains user and tenant information for API authentication
 */
export interface ExtensionTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

/**
 * Validate JWT token from Authorization header
 *
 * Validates the JWT token signature and expiration, then extracts
 * user and tenant information for authorization.
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Decoded token payload with user and tenant information
 * @throws FlowErrors.UNAUTHORIZED if token is invalid, expired, or missing
 *
 * @example
 * ```typescript
 * const token = await validateExtensionToken(request.headers.get("authorization"));
 * // Use token.userId and token.tenantId for authorization
 * ```
 */
export async function validateExtensionToken(
  authHeader: string | null
): Promise<ExtensionTokenPayload> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw FlowErrors.UNAUTHORIZED;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  );

  if (!secret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is not configured");
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    // Validate required fields
    if (
      !payload.userId ||
      !payload.tenantId ||
      typeof payload.userId !== "string" ||
      typeof payload.tenantId !== "string"
    ) {
      throw FlowErrors.UNAUTHORIZED;
    }

    return {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      email: (payload.email as string) || "",
      iat: payload.iat || 0,
      exp: payload.exp || 0,
    };
  } catch {
    // Token expired, invalid signature, etc.
    throw FlowErrors.UNAUTHORIZED;
  }
}
