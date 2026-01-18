import { NextRequest } from "next/server";
import { getFlowAnalyticsOverTime } from "@/lib/actions/analytics";
import { verifyFlowAccess } from "@/lib/utils/flow-auth";
import { auth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";
import { AppError, AppErrors } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(AppErrors.UNAUTHORIZED);
    }

    const { id } = await params;
    await verifyFlowAccess(id, session.user.id);

    // Get days parameter from query string (default: 30)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return createErrorResponse(
        new AppError("Invalid days parameter", "INVALID_INPUT", 400)
      );
    }

    const data = await getFlowAnalyticsOverTime(id, days);
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
