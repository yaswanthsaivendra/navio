"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFlows } from "@/hooks/use-flows";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Layers,
  X,
  Grid3x3,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import FlowCard from "./components/flow-card";
import type { FlowListItem } from "@/types/flow";

type FlowsClientProps = {
  initialData: {
    flows: FlowListItem[];
    total: number;
    limit: number;
    offset: number;
  };
  availableTags: string[];
  currentPage: number;
  limit: number;
};

export default function FlowsClient({
  initialData,
  availableTags,
  currentPage,
  limit,
}: FlowsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Build filters
  const filters = {
    search: search || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit,
    offset: (currentPage - 1) * limit,
  };

  const { data, isLoading } = useFlows(filters);
  const flowsData = data || initialData;

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/dashboard/flows?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      setSelectedTags(newTags);
      const params = new URLSearchParams(searchParams.toString());
      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }
      params.set("page", "1");
      router.push(`/dashboard/flows?${params.toString()}`);
    },
    [selectedTags, router, searchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    router.push("/dashboard/flows");
  }, [router]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`/dashboard/flows?${params.toString()}`);
    },
    [router, searchParams]
  );

  const totalPages = Math.ceil(flowsData.total / limit);
  const hasFilters = search || selectedTags.length > 0;

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 p-4 pt-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flows</h1>
            <p className="text-muted-foreground mt-2">
              Manage and view your automation flows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search flows by name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-8"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8"
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {flowsData.total === 0
              ? "No flows found"
              : `Showing ${flowsData.offset + 1}-${Math.min(
                  flowsData.offset + limit,
                  flowsData.total
                )} of ${flowsData.total} flows`}
          </p>
        </div>

        {/* Flows Grid/List */}
        {isLoading && !data ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "space-y-4"
            }
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full rounded-t-lg" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-1.5 h-3 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : flowsData.flows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="text-muted-foreground h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No flows found</h3>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                {hasFilters
                  ? "Try adjusting your search or filters"
                  : "Create your first flow using the browser extension"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "space-y-4"
              }
            >
              {flowsData.flows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
