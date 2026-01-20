import { NextRequest } from "next/server";
import { trackAnalyticsEvent } from "@/lib/actions/analytics";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/utils/api-response";
import { RATE_LIMIT } from "@/lib/constants/analytics";
import { z } from "zod";
import type { AnalyticsEventType } from "@/lib/generated/prisma/client";

// NOTE: In-memory rate limiting - resets on server restart
// For production with multiple instances, consider using Redis/Upstash for distributed rate limiting
const rateLimitMap = new Map<string, number[]>();

/**
 * Get rate limit key from request (IP address)
 */
function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];

  // Remove old requests outside the window
  const recentRequests = requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);
  return true;
}

/**
 * Validation schema for analytics event
 */
const AnalyticsEventSchema = z.object({
  flowId: z.string().min(1, "Flow ID is required"),
  shareId: z.string().optional(),
  eventType: z.enum(["VIEW", "FLOW_COMPLETE"], {
    message: "Invalid event type. Must be VIEW or FLOW_COMPLETE",
  }),
  sessionId: z.string().min(1, "Session ID is required"),
  embed: z.boolean().optional(), // Track if this is an embed view
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return createErrorResponse(new Error("Too many requests"), 429);
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = AnalyticsEventSchema.parse(body);

    await trackAnalyticsEvent({
      flowId: validated.flowId,
      shareId: validated.shareId,
      eventType: validated.eventType as AnalyticsEventType,
      sessionId: validated.sessionId,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
