/**
 * Analytics constants
 */

export const ANALYTICS_EVENT_TYPES = {
  VIEW: "VIEW",
  FLOW_COMPLETE: "FLOW_COMPLETE",
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100, // 100 requests per minute per IP
} as const;

/**
 * NOTE: Current rate limiting is in-memory and resets on server restart.
 * For production with multiple instances, consider using:
 * - Redis/Upstash for distributed rate limiting
 * - Vercel Edge Config
 * - Upstash Rate Limit library
 */
