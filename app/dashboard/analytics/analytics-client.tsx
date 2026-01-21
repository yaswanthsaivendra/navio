"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Share2,
  Layers,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useOverallAnalytics,
  useUsersEngagementOverTime,
  type OverallAnalytics,
} from "@/hooks/use-analytics";
import { ErrorState } from "@/components/error-state";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useState } from "react";

type DateRange = 7 | 30 | 90 | 365;

export default function AnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(30);

  const {
    data: analytics,
    isLoading: loading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useOverallAnalytics();

  const {
    data: usersEngagementOverTime = [],
    isLoading: usersEngagementLoading,
    error: chartError,
    refetch: refetchChart,
  } = useUsersEngagementOverTime(dateRange);

  // Chart configuration
  const chartConfig = {
    uniqueUsers: {
      label: "Unique Users",
      color: "var(--chart-1)",
    },
    engagementRate: {
      label: "Engagement Rate",
      color: "var(--chart-2)",
    },
  };

  // Format date for display (MMM DD)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          error={analyticsError}
          onRetry={() => refetchAnalytics()}
          title="Failed to load analytics"
          description="We couldn't load your analytics data. Please try again."
        />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto space-y-6 p-6 pb-16">
        <h1 className="text-3xl font-bold">Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
              <Layers className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalFlows}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shares
              </CardTitle>
              <Share2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalShares}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="cursor-help text-sm font-medium">
                    Unique Users
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distinct users who viewed your flows</p>
                </TooltipContent>
              </Tooltip>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalUniqueUsers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="cursor-help text-sm font-medium">
                    Engagement Rate
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of unique users who completed flows</p>
                </TooltipContent>
              </Tooltip>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.engagementRate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unique Users & Engagement Rate Chart */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Unique Users & Engagement Rate</CardTitle>
              <CardDescription>
                Showing unique users and engagement rate over time
              </CardDescription>
            </div>
            <Select
              value={dateRange.toString()}
              onValueChange={(value) =>
                setDateRange(Number(value) as DateRange)
              }
            >
              <SelectTrigger
                className="hidden w-[160px] cursor-pointer rounded-lg sm:ml-auto sm:flex"
                aria-label="Select time period"
              >
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7" className="cursor-pointer rounded-lg">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30" className="cursor-pointer rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="90" className="cursor-pointer rounded-lg">
                  Last 90 days
                </SelectItem>
                <SelectItem value="365" className="cursor-pointer rounded-lg">
                  All time
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {usersEngagementLoading ? (
              <ChartSkeleton className="h-[300px]" showHeader={false} />
            ) : chartError ? (
              <ErrorState
                error={chartError}
                onRetry={() => refetchChart()}
                title="Failed to load chart data"
                description="We couldn't load the chart data. Please try again."
              />
            ) : usersEngagementOverTime.length === 0 ? (
              <p className="text-muted-foreground">No data available</p>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
                role="img"
                aria-label="Chart showing unique users and engagement rate over time"
              >
                <AreaChart
                  data={usersEngagementOverTime}
                  accessibilityLayer
                  role="application"
                  aria-label="Analytics chart"
                >
                  <defs>
                    <linearGradient
                      id="fillUniqueUsers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-uniqueUsers)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-uniqueUsers)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillEngagementRate"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-engagementRate)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-engagementRate)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={formatDate}
                  />
                  {/* Left Y-axis for Unique Users */}
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  {/* Right Y-axis for Engagement Rate (percentage) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return formatDate(value);
                        }}
                        indicator="dot"
                        formatter={(value, name, item) => {
                          // Format engagement rate with % symbol
                          if (
                            name === "engagementRate" ||
                            item.dataKey === "engagementRate"
                          ) {
                            return `${Number(value).toFixed(2)}%`;
                          }
                          // Format unique users as number
                          return Number(value).toLocaleString();
                        }}
                      />
                    }
                  />
                  {/* Unique Users Area (left axis) */}
                  <Area
                    yAxisId="left"
                    dataKey="uniqueUsers"
                    type="natural"
                    fill="url(#fillUniqueUsers)"
                    stroke="var(--color-uniqueUsers)"
                  />
                  {/* Engagement Rate Area (right axis) */}
                  <Area
                    yAxisId="right"
                    dataKey="engagementRate"
                    type="natural"
                    fill="url(#fillEngagementRate)"
                    stroke="var(--color-engagementRate)"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Flows */}
        <Card>
          <CardHeader>
            <CardTitle id="top-flows-title">Top Flows</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topFlows.length === 0 ? (
              <p className="text-muted-foreground">No views yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  aria-labelledby="top-flows-title"
                  role="table"
                >
                  <thead>
                    <tr className="border-b">
                      <th
                        className="text-muted-foreground pb-2 text-left text-sm font-medium"
                        scope="col"
                      >
                        Flow
                      </th>
                      <th
                        className="text-muted-foreground pb-2 text-right text-sm font-medium"
                        scope="col"
                      >
                        Views
                      </th>
                      <th
                        className="text-muted-foreground pb-2 text-right text-sm font-medium"
                        scope="col"
                      >
                        Unique Users
                      </th>
                      <th
                        className="text-muted-foreground pb-2 text-right text-sm font-medium"
                        scope="col"
                      >
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topFlows.map(
                      (
                        flow: OverallAnalytics["topFlows"][number],
                        index: number
                      ) => (
                        <tr
                          key={flow.id}
                          className="group hover:bg-muted/50 border-b transition-colors"
                          role="row"
                        >
                          <td className="py-3" role="gridcell">
                            <Link
                              href={`/dashboard/flows/${flow.id}/analytics`}
                              className="hover:text-primary flex items-center gap-3 transition-colors"
                              title={`View detailed analytics for ${flow.name}`}
                              aria-label={`View analytics for ${flow.name}, ranked #${index + 1}`}
                            >
                              <span className="text-muted-foreground group-hover:text-foreground text-sm font-medium transition-colors">
                                #{index + 1}
                              </span>
                              <span className="flex-1 font-medium">
                                {flow.name}
                              </span>
                              <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-all group-hover:translate-x-1" />
                            </Link>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Eye className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">{flow.views}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Users className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {flow.uniqueUsers}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TrendingUp className="text-muted-foreground h-4 w-4" />
                              <span className="font-medium">
                                {flow.engagementRate.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
