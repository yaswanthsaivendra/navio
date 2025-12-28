/**
 * Custom error class for flow-related errors
 */
export class FlowError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "FlowError";
  }
}

/**
 * Common flow error constants
 */
export const FlowErrors = {
  NOT_FOUND: new FlowError("Flow not found", "FLOW_NOT_FOUND", 404),
  STEP_NOT_FOUND: new FlowError("Flow step not found", "STEP_NOT_FOUND", 404),
  UNAUTHORIZED: new FlowError("Unauthorized", "UNAUTHORIZED", 401),
  FORBIDDEN: new FlowError("Access denied", "FORBIDDEN", 403),
  VALIDATION_ERROR: new FlowError("Validation failed", "VALIDATION_ERROR", 400),
  SCREENSHOT_TOO_LARGE: new FlowError(
    "Screenshot too large",
    "SCREENSHOT_TOO_LARGE",
    413
  ),
  TENANT_ACCESS_DENIED: new FlowError(
    "Access denied to tenant",
    "TENANT_ACCESS_DENIED",
    403
  ),
  INVALID_STEP_ORDER: new FlowError(
    "Invalid step order",
    "INVALID_STEP_ORDER",
    400
  ),
};

/**
 * Format error for API responses
 */
export function formatErrorResponse(error: unknown): {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
} {
  if (error instanceof FlowError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
        statusCode: 500,
      },
    };
  }

  return {
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      statusCode: 500,
    },
  };
}
