"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFlows,
  getFlowById,
  updateFlow,
  deleteFlow,
} from "@/lib/actions/flow";
import { queryKeys, type FlowFilters } from "@/lib/queries/query-keys";
import type { UpdateFlowInput } from "@/lib/validations/flow";
import { useRouter } from "next/navigation";

/**
 * Query hook for fetching flows list
 */
export function useFlows(filters?: FlowFilters) {
  return useQuery({
    queryKey: queryKeys.flows.list(filters),
    queryFn: () => getFlows(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Query hook for fetching a single flow
 */
export function useFlow(flowId: string) {
  return useQuery({
    queryKey: queryKeys.flows.detail(flowId),
    queryFn: () => getFlowById(flowId),
    enabled: !!flowId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Mutation hook for updating a flow
 */
export function useUpdateFlow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: UpdateFlowInput }) =>
      updateFlow(flowId, data),
    onSuccess: (updatedFlow) => {
      // Invalidate and refetch flows list
      queryClient.invalidateQueries({ queryKey: queryKeys.flows.lists() });
      // Update the specific flow in cache
      queryClient.setQueryData(
        queryKeys.flows.detail(updatedFlow.id),
        updatedFlow
      );
      router.refresh();
    },
  });
}

/**
 * Mutation hook for deleting a flow
 */
export function useDeleteFlow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (flowId: string) => deleteFlow(flowId),
    onSuccess: (_, flowId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.flows.detail(flowId) });
      // Invalidate flows list
      queryClient.invalidateQueries({ queryKey: queryKeys.flows.lists() });
      // Redirect to flows list
      router.push("/dashboard/flows");
      router.refresh();
    },
  });
}
