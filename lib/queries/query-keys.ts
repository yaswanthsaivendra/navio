export const queryKeys = {
  flows: {
    all: ["flows"] as const,
    lists: () => [...queryKeys.flows.all, "list"] as const,
    list: (filters?: FlowFilters) =>
      [...queryKeys.flows.lists(), filters] as const,
    details: () => [...queryKeys.flows.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.flows.details(), id] as const,
  },
};

export type FlowFilters = {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
};
