import { NextRequest } from "next/server";
import { getFlowAnalytics } from "@/lib/actions/analytics";
import { verifyFlowAccess } from "@/lib/utils/flow-auth";
import { auth } from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    await verifyFlowAccess(id, session.user.id);

    const analytics = await getFlowAnalytics(id);
    return createSuccessResponse(analytics);
  } catch (error) {
    return createErrorResponse(error);
  }
}
