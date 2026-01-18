import { z } from "zod";

/**
 * Schema for overall analytics response
 */
export const OverallAnalyticsSchema = z.object({
  totalFlows: z.number().int().nonnegative(),
  totalShares: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  totalCompletions: z.number().int().nonnegative(),
  totalUniqueUsers: z.number().int().nonnegative(),
  engagementRate: z.number().nonnegative().max(100),
  topFlows: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      views: z.number().int().nonnegative(),
      uniqueUsers: z.number().int().nonnegative(),
      engagementRate: z.number().nonnegative().max(100),
    })
  ),
});

/**
 * Schema for flow analytics response
 */
export const FlowAnalyticsSchema = z.object({
  totalViews: z.number().int().nonnegative(),
  totalCompletions: z.number().int().nonnegative(),
  uniqueUsers: z.number().int().nonnegative(),
  engagementRate: z.number().nonnegative().max(100),
});

/**
 * Schema for time-based analytics data point
 */
export const TimeBasedAnalyticsPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  uniqueUsers: z.number().int().nonnegative(),
  engagementRate: z.number().nonnegative().max(100),
});

/**
 * Schema for users and engagement over time
 */
export const UsersEngagementOverTimeSchema = z.array(
  TimeBasedAnalyticsPointSchema
);

/**
 * Schema for flow analytics over time
 */
export const FlowAnalyticsOverTimeSchema = z.array(
  TimeBasedAnalyticsPointSchema
);

/**
 * Schema for flow step analytics
 */
export const FlowStepAnalyticsSchema = z.array(
  z.object({
    stepId: z.string().min(1),
    stepOrder: z.number().int().nonnegative(),
    stepExplanation: z.string(),
    views: z.number().int().nonnegative(),
    uniqueViewers: z.number().int().nonnegative(),
    dropOffRate: z.number().nonnegative().max(100),
    completionRate: z.number().nonnegative().max(100),
  })
);

/**
 * Schema for date range parameter
 */
export const DateRangeSchema = z
  .enum(["7", "30", "90", "365"])
  .transform((val) => Number(val) as 7 | 30 | 90 | 365);
