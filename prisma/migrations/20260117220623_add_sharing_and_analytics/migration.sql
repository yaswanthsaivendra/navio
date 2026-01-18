-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('VIEW', 'FLOW_COMPLETE');

-- CreateTable
CREATE TABLE "FlowShare" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "shareId" TEXT,
    "eventType" "AnalyticsEventType" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowShare_flowId_key" ON "FlowShare"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowShare_shareToken_key" ON "FlowShare"("shareToken");

-- CreateIndex
CREATE INDEX "FlowShare_flowId_idx" ON "FlowShare"("flowId");

-- CreateIndex
CREATE INDEX "FlowShare_shareToken_idx" ON "FlowShare"("shareToken");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_flowId_idx" ON "AnalyticsEvent"("flowId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shareId_idx" ON "AnalyticsEvent"("shareId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- AddForeignKey
ALTER TABLE "FlowShare" ADD CONSTRAINT "FlowShare_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowShare" ADD CONSTRAINT "FlowShare_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "FlowShare"("id") ON DELETE SET NULL ON UPDATE CASCADE;
