import { NextResponse } from "next/server";
import { AppError, formatErrorResponse } from "@/lib/errors";
import { ZodError } from "zod";

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

/**
 * Standard API response type (union of success and error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultStatus: number = 500
): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          statusCode: 400,
          details: error.issues,
        },
      },
      { status: 400 }
    );
  }

  // Handle AppError (includes FlowError)
  if (error instanceof AppError) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false as const,
        error: formatted.error,
      },
      { status: error.statusCode }
    );
  }

  // Handle generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message,
          statusCode: defaultStatus,
        },
      },
      { status: defaultStatus }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred",
        statusCode: defaultStatus,
      },
    },
    { status: defaultStatus }
  );
}

/**
 * Wrap an async route handler with standardized error handling
 * Automatically converts errors to standardized API responses
 */
export function withApiErrorHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler()
    .then((data) => createSuccessResponse(data))
    .catch((error) => createErrorResponse(error));
}

/**
 * Helper to create error responses for common HTTP status codes
 */
export const ApiResponses = {
  unauthorized: () =>
    createErrorResponse(new AppError("Unauthorized", "UNAUTHORIZED", 401)),
  forbidden: () =>
    createErrorResponse(new AppError("Forbidden", "FORBIDDEN", 403)),
  notFound: () =>
    createErrorResponse(new AppError("Not Found", "NOT_FOUND", 404)),
  badRequest: (message: string = "Bad Request") =>
    createErrorResponse(new AppError(message, "BAD_REQUEST", 400)),
  internalError: (message: string = "Internal Server Error") =>
    createErrorResponse(new AppError(message, "INTERNAL_ERROR", 500)),
};
