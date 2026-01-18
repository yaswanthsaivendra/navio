import { getUsersAndEngagementOverTime } from "@/lib/actions/analytics";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { auth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";
import { AppError, AppErrors } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(AppErrors.UNAUTHORIZED);
    }

    const activeTenant = await getActiveTenant();
    if (!activeTenant) {
      return createErrorResponse(AppErrors.TENANT_NOT_FOUND);
    }

    // Get days parameter from query string (default: 30)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return createErrorResponse(
        new AppError("Invalid days parameter", "INVALID_INPUT", 400)
      );
    }

    const data = await getUsersAndEngagementOverTime(activeTenant.id, days);
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
