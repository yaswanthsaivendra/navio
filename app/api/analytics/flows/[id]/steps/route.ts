import { NextRequest } from "next/server";
import { getFlowStepAnalytics } from "@/lib/actions/analytics";
import { verifyFlowAccess } from "@/lib/utils/flow-auth";
import { auth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";
import { AppErrors } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(AppErrors.UNAUTHORIZED);
    }

    const { id } = await params;
    await verifyFlowAccess(id, session.user.id);

    const data = await getFlowStepAnalytics(id);
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
