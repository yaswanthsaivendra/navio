import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./analytics-client";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <ErrorBoundary>
      <AnalyticsClient />
    </ErrorBoundary>
  );
}
