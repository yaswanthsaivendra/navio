"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShareFlowDialog from "../../components/share-flow-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Eye,
  Users,
  CheckCircle2,
  TrendingUp,
  Share2,
  Edit,
} from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useFlowAnalytics,
  useFlowAnalyticsOverTime,
  useFlowStepAnalytics,
  type FlowStepAnalytics,
} from "@/hooks/use-analytics";
import { ErrorState } from "@/components/error-state";
import { ChartSkeleton } from "@/components/chart-skeleton";

type DateRange = 7 | 30 | 90 | 365;

type FlowAnalyticsClientProps = {
  flowId: string;
  flowName: string;
};

export default function FlowAnalyticsClient({
  flowId,
  flowName,
}: FlowAnalyticsClientProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const {
    data: analytics,
    isLoading: loading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useFlowAnalytics(flowId);

  const {
    data: analyticsOverTime = [],
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useFlowAnalyticsOverTime(flowId, dateRange);

  const {
    data: stepAnalytics = [],
    isLoading: stepsLoading,
    error: stepsError,
    refetch: refetchSteps,
  } = useFlowStepAnalytics(flowId);

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
    views: {
      label: "Views",
      color: "var(--chart-3)",
    },
  };

  // Format date for display (MMM DD)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleBack = () => {
    router.push(`/dashboard/flows/${flowId}`);
  };

  const handleEdit = () => {
    router.push(`/dashboard/flows/${flowId}/edit`);
  };

  return (
    <TooltipProvider>
      <div className="bg-background fixed inset-0 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="shrink-0"
                aria-label="Back to flow"
                title="Back to flow"
              >
                <ArrowLeft className="h-4 w-4 text-current" />
                <span className="sr-only">Back to flow</span>
              </Button>
              <div className="bg-border h-6 w-px" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold">{flowName}</h1>
                <p className="text-muted-foreground text-sm">Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                title="Share flow"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                title="Edit flow steps and details"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-auto">
          <div className="container mx-auto w-full space-y-6 p-6 pb-16">
            {/* Summary Cards */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
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
            ) : analyticsError ? (
              <ErrorState
                error={analyticsError}
                onRetry={() => refetchAnalytics()}
                title="Failed to load analytics"
                description="We couldn't load the analytics data. Please try again."
              />
            ) : analytics ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Views
                    </CardTitle>
                    <Eye className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.totalViews}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Unique Users
                    </CardTitle>
                    <Users className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.uniqueUsers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completions
                    </CardTitle>
                    <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.totalCompletions}
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
                        <p>Percentage of unique users who completed the flow</p>
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
            ) : null}

            {/* Time-based Chart */}
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
                    aria-label="Select time period for analytics chart"
                    aria-describedby="date-range-description"
                  >
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="7" className="cursor-pointer rounded-lg">
                      Last 7 days
                    </SelectItem>
                    <SelectItem
                      value="30"
                      className="cursor-pointer rounded-lg"
                    >
                      Last 30 days
                    </SelectItem>
                    <SelectItem
                      value="90"
                      className="cursor-pointer rounded-lg"
                    >
                      Last 90 days
                    </SelectItem>
                    <SelectItem
                      value="365"
                      className="cursor-pointer rounded-lg"
                    >
                      All time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {chartLoading ? (
                  <ChartSkeleton className="h-[300px]" showHeader={false} />
                ) : chartError ? (
                  <ErrorState
                    error={chartError}
                    onRetry={() => refetchChart()}
                    title="Failed to load chart data"
                    description="We couldn't load the chart data. Please try again."
                  />
                ) : analyticsOverTime.length === 0 ? (
                  <p className="text-muted-foreground">No data available</p>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                    role="img"
                    aria-label="Chart showing unique users and engagement rate over time for this flow"
                  >
                    <AreaChart
                      data={analyticsOverTime}
                      accessibilityLayer
                      role="application"
                      aria-label="Flow analytics chart"
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
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs"
                      />
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
                              if (
                                name === "engagementRate" ||
                                item.dataKey === "engagementRate"
                              ) {
                                return `${Number(value).toFixed(2)}%`;
                              }
                              return Number(value).toLocaleString();
                            }}
                          />
                        }
                      />
                      <Area
                        yAxisId="left"
                        dataKey="uniqueUsers"
                        type="natural"
                        fill="url(#fillUniqueUsers)"
                        stroke="var(--color-uniqueUsers)"
                      />
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

            {/* Step Analytics */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Step Analytics</CardTitle>
                <CardDescription>Views for each step</CardDescription>
              </CardHeader>
              <CardContent>
                {stepsLoading ? (
                  <ChartSkeleton className="h-[300px]" showHeader={false} />
                ) : stepsError ? (
                  <ErrorState
                    error={stepsError}
                    onRetry={() => refetchSteps()}
                    title="Failed to load step analytics"
                    description="We couldn't load the step analytics data. Please try again."
                  />
                ) : stepAnalytics.length === 0 ? (
                  <p className="text-muted-foreground">
                    No step data available
                  </p>
                ) : (
                  <div className="space-y-4">
                    <ChartContainer
                      config={chartConfig}
                      className="h-[250px] w-full"
                      role="img"
                      aria-label="Chart showing views for each step"
                    >
                      <BarChart
                        data={stepAnalytics}
                        accessibilityLayer
                        role="application"
                        aria-label="Step analytics bar chart"
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="stepOrder"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `Step ${value + 1}`}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          className="text-xs"
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value, payload) => {
                                const item = payload?.[0];
                                return (
                                  item?.payload?.stepExplanation ||
                                  `Step ${Number(value) + 1}`
                                );
                              }}
                              indicator="dot"
                            />
                          }
                        />
                        <Bar
                          dataKey="views"
                          fill="var(--color-views)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-muted-foreground pb-2 text-left text-sm font-medium">
                              Step
                            </th>
                            <th className="text-muted-foreground pb-2 text-left text-sm font-medium">
                              Description
                            </th>
                            <th className="text-muted-foreground pb-2 text-right text-sm font-medium">
                              Views
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stepAnalytics.map(
                            (step: FlowStepAnalytics[number]) => (
                              <tr key={step.stepId} className="border-b">
                                <td className="py-3">
                                  <span className="text-sm font-medium">
                                    #{step.stepOrder + 1}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="text-sm">
                                    {step.stepExplanation}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <span className="font-medium">
                                    {step.views}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom spacer for better scroll experience */}
            <div className="h-32" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ShareFlowDialog
        flowId={flowId}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </TooltipProvider>
  );
}
