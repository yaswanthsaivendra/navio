import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyFlowAccess } from "@/lib/utils/flow-auth";
import FlowAnalyticsClient from "./flow-analytics-client";
import { ErrorBoundary } from "@/components/error-boundary";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FlowAnalyticsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  await verifyFlowAccess(id, session.user.id);

  // Fetch flow data
  const flow = await prisma.flow.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
    },
  });

  if (!flow) {
    redirect("/dashboard/flows");
  }

  return (
    <ErrorBoundary>
      <FlowAnalyticsClient flowId={id} flowName={flow.name} />
    </ErrorBoundary>
  );
}
