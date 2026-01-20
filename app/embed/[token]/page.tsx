import { notFound } from "next/navigation";
import { getPublicFlowByShareToken } from "@/lib/actions/flow-share";
import EmbedFlowViewer from "./embed-flow-viewer";
import type { Flow, FlowStep } from "@/lib/generated/prisma/client";

// Type for public flow (without creator requirement)
type PublicFlow = Flow & {
  steps: FlowStep[];
};

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getPublicFlowByShareToken(token);

  if (!share || !share.flow) {
    notFound();
  }

  // Type assertion: public flows don't need creator info
  return (
    <EmbedFlowViewer
      flow={share.flow as unknown as PublicFlow}
      shareId={share.id}
    />
  );
}
