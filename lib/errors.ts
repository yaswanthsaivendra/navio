/**
 * Base application error class
 * All application errors should extend this for consistent error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * FlowError - kept for backward compatibility
 * @deprecated Use AppError instead. This is maintained for existing code.
 */
export class FlowError extends AppError {
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, code, statusCode);
    this.name = "FlowError";
  }
}

/**
 * Common application errors
 * Organized by domain for better maintainability
 */
export const AppErrors = {
  // Authentication & Authorization
  UNAUTHORIZED: new AppError("Unauthorized", "UNAUTHORIZED", 401),
  FORBIDDEN: new AppError("Access denied", "FORBIDDEN", 403),
  TENANT_ACCESS_DENIED: new AppError(
    "Access denied to tenant",
    "TENANT_ACCESS_DENIED",
    403
  ),

  // Validation
  VALIDATION_ERROR: new AppError("Validation failed", "VALIDATION_ERROR", 400),
  INVALID_EMAIL: new AppError("Invalid email address", "INVALID_EMAIL", 400),
  INVALID_INPUT: new AppError("Invalid input", "INVALID_INPUT", 400),

  // Not Found
  NOT_FOUND: new AppError("Resource not found", "NOT_FOUND", 404),
  TENANT_NOT_FOUND: new AppError(
    "Organization not found",
    "TENANT_NOT_FOUND",
    404
  ),
  MEMBERSHIP_NOT_FOUND: new AppError(
    "Membership not found",
    "MEMBERSHIP_NOT_FOUND",
    404
  ),
  INVITATION_NOT_FOUND: new AppError(
    "Invitation not found",
    "INVITATION_NOT_FOUND",
    404
  ),

  // Flow-specific errors
  FLOW_NOT_FOUND: new AppError("Flow not found", "FLOW_NOT_FOUND", 404),
  STEP_NOT_FOUND: new AppError("Flow step not found", "STEP_NOT_FOUND", 404),
  SCREENSHOT_TOO_LARGE: new AppError(
    "Screenshot too large",
    "SCREENSHOT_TOO_LARGE",
    413
  ),
  INVALID_STEP_ORDER: new AppError(
    "Invalid step order",
    "INVALID_STEP_ORDER",
    400
  ),

  // Tenant errors
  TENANT_NAME_REQUIRED: new AppError(
    "Organization name is required",
    "TENANT_NAME_REQUIRED",
    400
  ),
  TENANT_UPDATE_FORBIDDEN: new AppError(
    "Only owners and admins can update organization settings",
    "TENANT_UPDATE_FORBIDDEN",
    403
  ),
  TENANT_DELETE_FORBIDDEN: new AppError(
    "Only the owner can delete the organization",
    "TENANT_DELETE_FORBIDDEN",
    403
  ),

  // Invitation errors
  INVITATION_ALREADY_MEMBER: new AppError(
    "This user is already a member of the organization",
    "INVITATION_ALREADY_MEMBER",
    409
  ),
  INVITATION_ALREADY_SENT: new AppError(
    "An invitation has already been sent to this email",
    "INVITATION_ALREADY_SENT",
    409
  ),
  INVITATION_EXPIRED: new AppError(
    "This invitation has expired",
    "INVITATION_EXPIRED",
    410
  ),
  INVITATION_ALREADY_ACCEPTED: new AppError(
    "This invitation has already been accepted",
    "INVITATION_ALREADY_ACCEPTED",
    409
  ),
  INVITATION_ALREADY_DECLINED: new AppError(
    "This invitation has already been declined",
    "INVITATION_ALREADY_DECLINED",
    409
  ),
  INVITATION_EMAIL_MISMATCH: new AppError(
    "This invitation was sent to a different email address",
    "INVITATION_EMAIL_MISMATCH",
    403
  ),
  INVITATION_MUST_BE_SIGNED_IN: new AppError(
    "You must be signed in to accept an invitation",
    "INVITATION_MUST_BE_SIGNED_IN",
    401
  ),
  INVITATION_CANCEL_FORBIDDEN: new AppError(
    "Only owners and admins can cancel invitations",
    "INVITATION_CANCEL_FORBIDDEN",
    403
  ),
  INVITATION_RESEND_FORBIDDEN: new AppError(
    "Only owners and admins can resend invitations",
    "INVITATION_RESEND_FORBIDDEN",
    403
  ),
  INVITE_PERMISSION_DENIED: new AppError(
    "Only owners and admins can invite members",
    "INVITE_PERMISSION_DENIED",
    403
  ),

  // Membership errors
  MEMBERSHIP_ROLE_UPDATE_FORBIDDEN: new AppError(
    "Only the owner can change member roles",
    "MEMBERSHIP_ROLE_UPDATE_FORBIDDEN",
    403
  ),
  MEMBERSHIP_CANNOT_CHANGE_OWN_ROLE: new AppError(
    "You cannot change your own role",
    "MEMBERSHIP_CANNOT_CHANGE_OWN_ROLE",
    403
  ),
  MEMBERSHIP_REMOVE_FORBIDDEN: new AppError(
    "Only the owner can remove members",
    "MEMBERSHIP_REMOVE_FORBIDDEN",
    403
  ),
  MEMBERSHIP_CANNOT_REMOVE_SELF: new AppError(
    "You cannot remove yourself from the organization",
    "MEMBERSHIP_CANNOT_REMOVE_SELF",
    403
  ),
  MEMBERSHIP_CANNOT_REMOVE_LAST_OWNER: new AppError(
    "Cannot remove the last owner. Transfer ownership first.",
    "MEMBERSHIP_CANNOT_REMOVE_LAST_OWNER",
    403
  ),
  MEMBERSHIP_CANNOT_LEAVE_AS_LAST_OWNER: new AppError(
    "Cannot leave as the last owner. Transfer ownership or delete the organization.",
    "MEMBERSHIP_CANNOT_LEAVE_AS_LAST_OWNER",
    403
  ),
  MEMBERSHIP_NOT_MEMBER: new AppError(
    "You are not a member of this organization",
    "MEMBERSHIP_NOT_MEMBER",
    403
  ),
  MEMBERSHIP_ALREADY_MEMBER: new AppError(
    "You are already a member of this organization",
    "MEMBERSHIP_ALREADY_MEMBER",
    409
  ),
};

/**
 * FlowErrors - kept for backward compatibility
 * @deprecated Use AppErrors instead. This is maintained for existing code.
 */
export const FlowErrors = {
  NOT_FOUND: AppErrors.FLOW_NOT_FOUND,
  STEP_NOT_FOUND: AppErrors.STEP_NOT_FOUND,
  UNAUTHORIZED: AppErrors.UNAUTHORIZED,
  FORBIDDEN: AppErrors.FORBIDDEN,
  VALIDATION_ERROR: AppErrors.VALIDATION_ERROR,
  SCREENSHOT_TOO_LARGE: AppErrors.SCREENSHOT_TOO_LARGE,
  TENANT_ACCESS_DENIED: AppErrors.TENANT_ACCESS_DENIED,
  INVALID_STEP_ORDER: AppErrors.INVALID_STEP_ORDER,
};

/**
 * Convert Zod validation error to AppError
 * Extracts the first error message for a cleaner error response
 */
export function zodErrorToAppError(error: unknown): AppError {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as {
      issues: Array<{ message: string; path: (string | number)[] }>;
    };
    const firstIssue = zodError.issues[0];
    const field = firstIssue.path.join(".");
    const message = field
      ? `${field}: ${firstIssue.message}`
      : firstIssue.message;
    return new AppError(message, "VALIDATION_ERROR", 400);
  }
  return AppErrors.VALIDATION_ERROR;
}

/**
 * Format error for API responses
 * Handles both AppError and legacy FlowError for backward compatibility
 */
export function formatErrorResponse(error: unknown): {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
} {
  if (error instanceof AppError || error instanceof FlowError) {
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
