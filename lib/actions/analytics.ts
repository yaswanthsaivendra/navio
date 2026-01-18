"use server";

import { prisma } from "@/lib/db";
import { AppErrors } from "@/lib/errors";
import { AnalyticsEventType } from "@/lib/generated/prisma/client";

/**
 * Track an analytics event (public endpoint, no auth required)
 */
export async function trackAnalyticsEvent(data: {
  flowId: string;
  shareId?: string;
  eventType: AnalyticsEventType;
  sessionId: string;
}) {
  // Validate input format
  if (
    !data.flowId ||
    typeof data.flowId !== "string" ||
    data.flowId.length < 1
  ) {
    throw AppErrors.FLOW_NOT_FOUND;
  }

  if (
    !data.sessionId ||
    typeof data.sessionId !== "string" ||
    data.sessionId.length < 1
  ) {
    throw AppErrors.VALIDATION_ERROR;
  }

  // Validate that flow exists
  const flow = await prisma.flow.findUnique({
    where: { id: data.flowId },
  });

  if (!flow) {
    throw AppErrors.FLOW_NOT_FOUND;
  }

  // Validate shareId if provided
  if (data.shareId) {
    if (typeof data.shareId !== "string" || data.shareId.length < 1) {
      throw AppErrors.VALIDATION_ERROR;
    }

    const share = await prisma.flowShare.findUnique({
      where: { id: data.shareId },
    });

    if (!share || share.flowId !== data.flowId) {
      throw AppErrors.FLOW_NOT_FOUND;
    }
  }

  // Create event
  await prisma.analyticsEvent.create({
    data: {
      flowId: data.flowId,
      shareId: data.shareId,
      eventType: data.eventType,
      sessionId: data.sessionId,
    },
  });
}

/**
 * Get analytics for a flow
 */
export async function getFlowAnalytics(flowId: string) {
  const [
    totalViews,
    totalCompletions,
    uniqueViewersSessions,
    uniqueCompletersSessions,
  ] = await Promise.all([
    // Total views
    prisma.analyticsEvent.count({
      where: {
        flowId,
        eventType: "VIEW",
      },
    }),
    // Total completions
    prisma.analyticsEvent.count({
      where: {
        flowId,
        eventType: "FLOW_COMPLETE",
      },
    }),
    // Unique sessions that viewed
    prisma.analyticsEvent.findMany({
      where: {
        flowId,
        eventType: "VIEW",
      },
      select: {
        sessionId: true,
      },
      distinct: ["sessionId"],
    }),
    // Unique sessions that completed
    prisma.analyticsEvent.findMany({
      where: {
        flowId,
        eventType: "FLOW_COMPLETE",
      },
      select: {
        sessionId: true,
      },
      distinct: ["sessionId"],
    }),
  ]);

  const uniqueUsers = uniqueViewersSessions.length;
  const uniqueCompleters = uniqueCompletersSessions.length;
  const engagementRate =
    uniqueUsers > 0 ? (uniqueCompleters / uniqueUsers) * 100 : 0;

  return {
    totalViews,
    totalCompletions,
    uniqueUsers,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
}

/**
 * Get overall analytics for a tenant
 * Optimized to avoid N+1 queries using aggregation
 */
export async function getOverallAnalytics(tenantId: string) {
  const [
    totalFlows,
    totalShares,
    totalViews,
    totalCompletions,
    uniqueSessions,
    uniqueCompleters,
  ] = await Promise.all([
    // Total flows
    prisma.flow.count({
      where: { tenantId },
    }),
    // Total shares
    prisma.flowShare.count({
      where: {
        flow: {
          tenantId,
        },
      },
    }),
    // Total views across all flows
    prisma.analyticsEvent.count({
      where: {
        flow: {
          tenantId,
        },
        eventType: "VIEW",
      },
    }),
    // Total completions
    prisma.analyticsEvent.count({
      where: {
        flow: {
          tenantId,
        },
        eventType: "FLOW_COMPLETE",
      },
    }),
    // Unique users (distinct sessions that viewed flows)
    prisma.analyticsEvent.findMany({
      where: {
        flow: {
          tenantId,
        },
        eventType: "VIEW",
      },
      select: {
        sessionId: true,
      },
      distinct: ["sessionId"],
    }),
    // Unique users who completed (distinct sessions that completed flows)
    prisma.analyticsEvent.findMany({
      where: {
        flow: {
          tenantId,
        },
        eventType: "FLOW_COMPLETE",
      },
      select: {
        sessionId: true,
      },
      distinct: ["sessionId"],
    }),
  ]);

  const totalUniqueUsers = uniqueSessions.length;
  const uniqueUsersWhoCompleted = uniqueCompleters.length;

  // Calculate engagement rate: (Unique Users Who Completed / Total Unique Users) × 100
  // This gives the percentage of unique users who completed at least one flow
  const engagementRate =
    totalUniqueUsers > 0
      ? (uniqueUsersWhoCompleted / totalUniqueUsers) * 100
      : 0;

  // Get top 5 flows by views with all metrics in a single optimized query
  // Using raw SQL for better performance (avoids N+1 queries)
  const topFlowsRaw = await prisma.$queryRaw<
    Array<{
      flowId: string;
      views: number;
      uniqueUsers: number;
      uniqueCompleters: number;
    }>
  >`
    WITH flow_views AS (
      SELECT 
        "flowId",
        COUNT(*)::int as views
      FROM "AnalyticsEvent"
      WHERE 
        "eventType" = 'VIEW'
        AND EXISTS (
          SELECT 1 FROM "Flow"
          WHERE "Flow".id = "AnalyticsEvent"."flowId"
          AND "Flow"."tenantId" = ${tenantId}
        )
      GROUP BY "flowId"
      ORDER BY views DESC
      LIMIT 5
    ),
    flow_unique_viewers AS (
      SELECT 
        "flowId",
        COUNT(DISTINCT "sessionId")::int as unique_users
      FROM "AnalyticsEvent"
      WHERE 
        "eventType" = 'VIEW'
        AND "flowId" IN (SELECT "flowId" FROM flow_views)
      GROUP BY "flowId"
    ),
    flow_unique_completers AS (
      SELECT 
        "flowId",
        COUNT(DISTINCT "sessionId")::int as unique_completers
      FROM "AnalyticsEvent"
      WHERE 
        "eventType" = 'FLOW_COMPLETE'
        AND "flowId" IN (SELECT "flowId" FROM flow_views)
      GROUP BY "flowId"
    )
    SELECT 
      fv."flowId",
      fv.views,
      COALESCE(fuv.unique_users, 0)::int as "uniqueUsers",
      COALESCE(fuc.unique_completers, 0)::int as "uniqueCompleters"
    FROM flow_views fv
    LEFT JOIN flow_unique_viewers fuv ON fv."flowId" = fuv."flowId"
    LEFT JOIN flow_unique_completers fuc ON fv."flowId" = fuc."flowId"
    ORDER BY fv.views DESC
  `;

  // Fetch flow names for top flows
  const flowIds = topFlowsRaw.map((item) => item.flowId);
  const flows = await prisma.flow.findMany({
    where: {
      id: { in: flowIds },
      tenantId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Map results with engagement rate calculation
  const topFlows = topFlowsRaw.map((item) => {
    const flow = flows.find((f) => f.id === item.flowId);
    const engagementRate =
      item.uniqueUsers > 0
        ? (item.uniqueCompleters / item.uniqueUsers) * 100
        : 0;

    return {
      id: item.flowId,
      name: flow?.name || "Unknown",
      views: item.views,
      uniqueUsers: item.uniqueUsers,
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  });

  return {
    totalFlows,
    totalShares,
    totalViews,
    totalCompletions,
    totalUniqueUsers,
    engagementRate: Math.round(engagementRate * 100) / 100,
    topFlows,
  };
}

/**
 * Get views over time for analytics charts
 * Returns daily view counts for the specified date range
 */
export async function getViewsOverTime(
  tenantId: string,
  days: number = 30
): Promise<Array<{ date: string; views: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get views grouped by date
  // PostgreSQL uses DATE_TRUNC or CAST for date grouping
  const viewsByDate = await prisma.$queryRaw<
    Array<{ date: string; views: number }>
  >`
    SELECT 
      DATE("timestamp")::text as date,
      COUNT(*)::int as views
    FROM "AnalyticsEvent"
    WHERE 
      "eventType" = 'VIEW'
      AND "timestamp" >= ${startDate}
      AND EXISTS (
        SELECT 1 FROM "Flow"
        WHERE "Flow".id = "AnalyticsEvent"."flowId"
        AND "Flow"."tenantId" = ${tenantId}
      )
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `;

  // Fill in missing dates with 0 views
  const result: Array<{ date: string; views: number }> = [];
  const dateMap = new Map(viewsByDate.map((item) => [item.date, item.views]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Include today in the range, so loop from startDate to today (inclusive)
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Stop if we've gone past today
    if (date > today) break;

    const dateStr = date.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      views: dateMap.get(dateStr) || 0,
    });
  }

  return result;
}

/**
 * Get unique users and engagement rate over time for analytics charts
 * Returns daily unique users and engagement rate for the specified date range
 */
export async function getUsersAndEngagementOverTime(
  tenantId: string,
  days: number = 30
): Promise<
  Array<{
    date: string;
    uniqueUsers: number;
    engagementRate: number;
  }>
> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get unique users per day (distinct sessions that viewed)
  const uniqueUsersByDate = await prisma.$queryRaw<
    Array<{ date: string; uniqueUsers: number }>
  >`
    SELECT 
      DATE("timestamp")::text as date,
      COUNT(DISTINCT "sessionId")::int as "uniqueUsers"
    FROM "AnalyticsEvent"
    WHERE 
      "eventType" = 'VIEW'
      AND "timestamp" >= ${startDate}
      AND EXISTS (
        SELECT 1 FROM "Flow"
        WHERE "Flow".id = "AnalyticsEvent"."flowId"
        AND "Flow"."tenantId" = ${tenantId}
      )
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `;

  // Get unique completers per day (distinct sessions that completed)
  const uniqueCompletersByDate = await prisma.$queryRaw<
    Array<{ date: string; uniqueCompleters: number }>
  >`
    SELECT 
      DATE("timestamp")::text as date,
      COUNT(DISTINCT "sessionId")::int as "uniqueCompleters"
    FROM "AnalyticsEvent"
    WHERE 
      "eventType" = 'FLOW_COMPLETE'
      AND "timestamp" >= ${startDate}
      AND EXISTS (
        SELECT 1 FROM "Flow"
        WHERE "Flow".id = "AnalyticsEvent"."flowId"
        AND "Flow"."tenantId" = ${tenantId}
      )
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `;

  // Create maps for quick lookup
  const uniqueUsersMap = new Map(
    uniqueUsersByDate.map((item) => [item.date, Number(item.uniqueUsers)])
  );
  const uniqueCompletersMap = new Map(
    uniqueCompletersByDate.map((item) => [
      item.date,
      Number(item.uniqueCompleters),
    ])
  );

  // Fill in missing dates with 0 values
  const result: Array<{
    date: string;
    uniqueUsers: number;
    engagementRate: number;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Include today in the range, so loop from startDate to today (inclusive)
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Stop if we've gone past today
    if (date > today) break;

    const dateStr = date.toISOString().split("T")[0];
    const uniqueUsers = uniqueUsersMap.get(dateStr) || 0;
    const uniqueCompleters = uniqueCompletersMap.get(dateStr) || 0;
    const engagementRate =
      uniqueUsers > 0 ? (uniqueCompleters / uniqueUsers) * 100 : 0;

    result.push({
      date: dateStr,
      uniqueUsers,
      engagementRate: Math.round(engagementRate * 100) / 100,
    });
  }

  return result;
}

/**
 * Get analytics over time for a specific flow
 * Returns daily unique users and engagement rate for the specified date range
 */
export async function getFlowAnalyticsOverTime(
  flowId: string,
  days: number = 30
): Promise<
  Array<{
    date: string;
    uniqueUsers: number;
    engagementRate: number;
  }>
> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get unique users per day (distinct sessions that viewed this flow)
  const uniqueUsersByDate = await prisma.$queryRaw<
    Array<{ date: string; uniqueUsers: number }>
  >`
    SELECT 
      DATE("timestamp")::text as date,
      COUNT(DISTINCT "sessionId")::int as "uniqueUsers"
    FROM "AnalyticsEvent"
    WHERE 
      "eventType" = 'VIEW'
      AND "flowId" = ${flowId}
      AND "timestamp" >= ${startDate}
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `;

  // Get unique completers per day (distinct sessions that completed this flow)
  const uniqueCompletersByDate = await prisma.$queryRaw<
    Array<{ date: string; uniqueCompleters: number }>
  >`
    SELECT 
      DATE("timestamp")::text as date,
      COUNT(DISTINCT "sessionId")::int as "uniqueCompleters"
    FROM "AnalyticsEvent"
    WHERE 
      "eventType" = 'FLOW_COMPLETE'
      AND "flowId" = ${flowId}
      AND "timestamp" >= ${startDate}
    GROUP BY DATE("timestamp")
    ORDER BY date ASC
  `;

  // Create maps for quick lookup
  const uniqueUsersMap = new Map(
    uniqueUsersByDate.map((item) => [item.date, Number(item.uniqueUsers)])
  );
  const uniqueCompletersMap = new Map(
    uniqueCompletersByDate.map((item) => [
      item.date,
      Number(item.uniqueCompleters),
    ])
  );

  // Fill in missing dates with 0 values
  const result: Array<{
    date: string;
    uniqueUsers: number;
    engagementRate: number;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Include today in the range, so loop from startDate to today (inclusive)
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Stop if we've gone past today
    if (date > today) break;

    const dateStr = date.toISOString().split("T")[0];
    const uniqueUsers = uniqueUsersMap.get(dateStr) || 0;
    const uniqueCompleters = uniqueCompletersMap.get(dateStr) || 0;
    const engagementRate =
      uniqueUsers > 0 ? (uniqueCompleters / uniqueUsers) * 100 : 0;

    result.push({
      date: dateStr,
      uniqueUsers,
      engagementRate: Math.round(engagementRate * 100) / 100,
    });
  }

  return result;
}

/**
 * Get step-by-step analytics for a flow
 * Returns analytics per step (basic version - inferred from flow completion)
 * Note: Full step tracking requires additional event types (future enhancement)
 */
export async function getFlowStepAnalytics(flowId: string) {
  // Get flow with steps
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      steps: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!flow || !flow.steps.length) {
    return [];
  }

  // Get total views and completions for the flow
  const [totalViews, totalCompletions] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        flowId,
        eventType: "VIEW",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        flowId,
        eventType: "FLOW_COMPLETE",
      },
    }),
  ]);

  // For MVP, we infer step analytics:
  // - All steps are viewed by all viewers (simplified assumption)
  // Note: Drop-off rates are not available until step-level tracking is implemented
  const totalSteps = flow.steps.length;
  const completionRate = totalViews > 0 ? totalCompletions / totalViews : 0;

  return flow.steps.map((step, index) => {
    // Views: All viewers see all steps (simplified)
    const views = totalViews;
    const isLastStep = index === totalSteps - 1;

    return {
      stepId: step.id,
      stepOrder: step.order,
      stepExplanation: step.explanation,
      views,
      uniqueViewers: totalViews, // Simplified: same as views
      completionRate: isLastStep ? completionRate : 0,
    };
  });
}
