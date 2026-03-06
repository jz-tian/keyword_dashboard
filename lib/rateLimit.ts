/**
 * Simple in-memory token bucket rate limiter.
 * 10 requests per minute per IP.
 */

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

const CAPACITY = 10; // max tokens per bucket
const REFILL_RATE = 10; // tokens added per minute

const buckets = new Map<string, BucketEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number; // ms until full refill
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: CAPACITY, lastRefill: now };

  // Refill proportionally to time elapsed
  const elapsedMinutes = (now - bucket.lastRefill) / 60_000;
  const refilled = Math.min(CAPACITY, bucket.tokens + elapsedMinutes * REFILL_RATE);

  if (refilled < 1) {
    buckets.set(ip, { tokens: refilled, lastRefill: now });
    const resetMs = Math.ceil((1 - refilled) / REFILL_RATE * 60_000);
    return { allowed: false, remaining: 0, resetMs };
  }

  const newTokens = refilled - 1;
  buckets.set(ip, { tokens: newTokens, lastRefill: now });
  return { allowed: true, remaining: Math.floor(newTokens), resetMs: 0 };
}

export function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
