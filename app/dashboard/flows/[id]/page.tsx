import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getFlowById } from "@/lib/actions/flow";
import FlowDetailClient from "./flow-detail-client";

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Await params in Next.js 15+
  const { id } = await params;

  let flow;
  try {
    flow = await getFlowById(id);
  } catch (error) {
    // Error is already handled by getFlowById (throws FlowErrors)
    // If it reaches here, it's an unexpected error
    console.error("Error fetching flow:", error);
    notFound();
  }

  if (!flow) {
    notFound();
  }

  return <FlowDetailClient flow={flow} />;
}
