import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { getFlows } from "@/lib/actions/flow";
import FlowsClient from "./flows-client";

export default async function FlowsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const activeTenant = await getActiveTenant();

  if (!activeTenant) {
    redirect("/onboarding");
  }

  // Await searchParams in Next.js 15+
  const resolvedSearchParams = await searchParams;

  // Parse search params
  const search = resolvedSearchParams.search;
  const tags = resolvedSearchParams.tags
    ? resolvedSearchParams.tags.split(",").filter(Boolean)
    : undefined;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch initial flows data
  const initialData = await getFlows({
    search,
    tags,
    limit,
    offset,
  });

  // Extract unique tags from flows (only fetch meta field, no steps)
  // Limit to recent flows to get common tags
  const recentFlows = await getFlows({ limit: 100 });
  const allTags = new Set<string>();
  recentFlows.flows.forEach((flow) => {
    const meta = flow.meta as { tags?: string[] } | null;
    if (meta?.tags) {
      meta.tags.forEach((tag) => allTags.add(tag));
    }
  });

  return (
    <FlowsClient
      initialData={initialData}
      availableTags={Array.from(allTags).sort()}
      currentPage={page}
      limit={limit}
    />
  );
}
