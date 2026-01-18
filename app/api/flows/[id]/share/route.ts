import { NextRequest } from "next/server";
import {
  createFlowShare,
  deleteFlowShare,
  getFlowShare,
} from "@/lib/actions/flow-share";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const share = await createFlowShare(id);
    return createSuccessResponse(share);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteFlowShare(id);
    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const share = await getFlowShare(id);
    return createSuccessResponse(share);
  } catch (error) {
    return createErrorResponse(error);
  }
}
