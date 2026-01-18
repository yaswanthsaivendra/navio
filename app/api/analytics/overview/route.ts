import { getOverallAnalytics } from "@/lib/actions/analytics";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { auth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";
import { AppErrors } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(AppErrors.UNAUTHORIZED);
    }

    const activeTenant = await getActiveTenant();
    if (!activeTenant) {
      return createErrorResponse(AppErrors.TENANT_NOT_FOUND);
    }

    const analytics = await getOverallAnalytics(activeTenant.id);
    return createSuccessResponse(analytics);
  } catch (error) {
    return createErrorResponse(error);
  }
}
