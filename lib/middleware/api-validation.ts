import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import { validateExtensionToken } from "./extension-auth";
import { verifyTenantAccess } from "@/lib/utils/flow-auth";
import { createErrorResponse } from "@/lib/utils/api-response";
import { AppError } from "@/lib/errors";

/**
 * Validation options for API route middleware
 */
export interface ApiValidationOptions {
  /** Validate request body with Zod schema */
  body?: ZodSchema;
  /** Require authentication via extension token */
  requireExtensionAuth?: boolean;
  /** Require NextAuth session */
  requireAuth?: boolean;
  /** Verify tenant access after authentication */
  requireTenantAccess?: boolean;
}

/**
 * Validated request context
 */
export interface ValidatedRequestContext {
  /** Parsed and validated request body (if body schema provided) */
  body?: unknown;
  /** Extension token payload (if extension auth required) */
  extensionToken?: {
    userId: string;
    tenantId: string;
    email: string;
  };
  /** Session user (if NextAuth required) */
  session?: {
    user: {
      id: string;
      email?: string;
    };
  };
}

/**
 * API route handler with validated context
 */
export type ValidatedApiHandler<T = unknown> = (
  request: NextRequest,
  context: ValidatedRequestContext
) => Promise<T> | T;

/**
 * Create middleware wrapper for API routes with validation
 *
 * @example
 * ```ts
 * export const POST = withApiValidation(
 *   { body: CreateFlowSchema, requireExtensionAuth: true },
 *   async (req, { body, extensionToken }) => {
 *     // body is validated, extensionToken is available
 *     // Handle request...
 *   }
 * );
 * ```
 */
export function withApiValidation<T = unknown>(
  options: ApiValidationOptions,
  handler: ValidatedApiHandler<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const context: ValidatedRequestContext = {};

      // Validate extension token if required
      if (options.requireExtensionAuth) {
        const authHeader = request.headers.get("authorization");
        const tokenPayload = await validateExtensionToken(authHeader);
        context.extensionToken = {
          userId: tokenPayload.userId,
          tenantId: tokenPayload.tenantId,
          email: tokenPayload.email,
        };

        // Verify tenant access if required
        if (options.requireTenantAccess !== false) {
          await verifyTenantAccess(tokenPayload.tenantId, tokenPayload.userId);
        }
      }

      // Validate request body if schema provided
      if (options.body) {
        let bodyData: unknown;
        try {
          bodyData = await request.json();
        } catch {
          return createErrorResponse(
            new AppError("Invalid JSON", "INVALID_JSON", 400)
          );
        }

        try {
          context.body = options.body.parse(bodyData);
        } catch (error) {
          // Zod validation error will be handled by createErrorResponse
          return createErrorResponse(error, 400);
        }
      }

      // Execute handler with validated context
      const result = await handler(request, context);

      // If handler returns a NextResponse, use it directly
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise wrap in success response
      const { createSuccessResponse } = await import(
        "@/lib/utils/api-response"
      );
      return createSuccessResponse(result);
    } catch (error) {
      const { createErrorResponse } = await import("@/lib/utils/api-response");
      return createErrorResponse(error);
    }
  };
}

/**
 * Helper to validate query parameters
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return schema.parse(params);
}
