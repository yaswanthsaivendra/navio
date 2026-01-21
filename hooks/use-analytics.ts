"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";
import {
  OverallAnalyticsSchema,
  FlowAnalyticsSchema,
  UsersEngagementOverTimeSchema,
  FlowAnalyticsOverTimeSchema,
  FlowStepAnalyticsSchema,
} from "@/lib/validations/analytics";

export type OverallAnalytics = z.infer<typeof OverallAnalyticsSchema>;
export type FlowAnalytics = z.infer<typeof FlowAnalyticsSchema>;
export type UsersEngagementOverTime = z.infer<
  typeof UsersEngagementOverTimeSchema
>;
export type FlowAnalyticsOverTime = z.infer<typeof FlowAnalyticsOverTimeSchema>;
export type FlowStepAnalytics = z.infer<typeof FlowStepAnalyticsSchema>;
export type DateRange = 7 | 30 | 90 | 365;

/**
 * Fetch with error handling and response validation
 */
async function fetchWithErrorHandling<T>(
  url: string,
  schema: z.ZodSchema<T>,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { message: "Failed to fetch data", statusCode: response.status },
    }));

    const error = new Error(
      errorData.error?.message ||
        `Request failed with status ${response.status}`
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const result = await response.json();
  const data = result.success ? result.data : result;

  // Validate response with Zod schema
  try {
    return schema.parse(data);
  } catch (validationError) {
    const error = new Error(
      `Invalid response format: ${validationError instanceof Error ? validationError.message : "Unknown validation error"}`
    );
    (error as Error & { validationError?: unknown }).validationError =
      validationError;
    throw error;
  }
}

/**
 * Hook to fetch overall analytics
 */
export function useOverallAnalytics(
  options?: Omit<
    UseQueryOptions<OverallAnalytics, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<OverallAnalytics, Error>({
    queryKey: ["analytics", "overview"],
    queryFn: ({ signal }) =>
      fetchWithErrorHandling<OverallAnalytics>(
        "/api/analytics/overview",
        OverallAnalyticsSchema,
        signal
      ),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch users and engagement over time
 */
export function useUsersEngagementOverTime(
  days: DateRange,
  options?: Omit<
    UseQueryOptions<UsersEngagementOverTime, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<UsersEngagementOverTime, Error>({
    queryKey: ["analytics", "users-engagement-over-time", days],
    queryFn: ({ signal }) =>
      fetchWithErrorHandling<UsersEngagementOverTime>(
        `/api/analytics/users-engagement-over-time?days=${days}`,
        UsersEngagementOverTimeSchema,
        signal
      ),
    staleTime: 1000 * 30,
    ...options,
  });
}

/**
 * Hook to fetch flow analytics
 */
export function useFlowAnalytics(
  flowId: string,
  options?: Omit<UseQueryOptions<FlowAnalytics, Error>, "queryKey" | "queryFn">
) {
  return useQuery<FlowAnalytics, Error>({
    queryKey: ["analytics", "flows", flowId],
    queryFn: ({ signal }) =>
      fetchWithErrorHandling<FlowAnalytics>(
        `/api/analytics/flows/${flowId}`,
        FlowAnalyticsSchema,
        signal
      ),
    enabled: !!flowId,
    staleTime: 1000 * 30,
    ...options,
  });
}

/**
 * Hook to fetch flow analytics over time
 */
export function useFlowAnalyticsOverTime(
  flowId: string,
  days: DateRange,
  options?: Omit<
    UseQueryOptions<FlowAnalyticsOverTime, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<FlowAnalyticsOverTime, Error>({
    queryKey: ["analytics", "flows", flowId, "over-time", days],
    queryFn: ({ signal }) =>
      fetchWithErrorHandling<FlowAnalyticsOverTime>(
        `/api/analytics/flows/${flowId}/over-time?days=${days}`,
        FlowAnalyticsOverTimeSchema,
        signal
      ),
    enabled: !!flowId,
    staleTime: 1000 * 30,
    ...options,
  });
}

/**
 * Hook to fetch flow step analytics
 */
export function useFlowStepAnalytics(
  flowId: string,
  options?: Omit<
    UseQueryOptions<FlowStepAnalytics, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<FlowStepAnalytics, Error>({
    queryKey: ["analytics", "flows", flowId, "steps"],
    queryFn: ({ signal }) =>
      fetchWithErrorHandling<FlowStepAnalytics>(
        `/api/analytics/flows/${flowId}/steps`,
        FlowStepAnalyticsSchema,
        signal
      ),
    enabled: !!flowId,
    staleTime: 1000 * 30,
    ...options,
  });
}
