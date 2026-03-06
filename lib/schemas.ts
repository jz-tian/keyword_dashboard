import { z } from "zod";

// ── Query params validation ───────────────────────────────────
export const SearchParamsSchema = z.object({
  keyword: z.string().min(1).max(100).trim(),
  region: z.enum(["worldwide", "germany", "us"]).default("worldwide"),
  window: z.enum(["24h", "7d", "30d"]).default("7d"),
});

// ── API response schemas ──────────────────────────────────────
export const TrendPointSchema = z.object({
  date: z.string(),
  value: z.number().min(0).max(100),
});

export const RegionInterestSchema = z.object({
  region: z.string(),
  value: z.number().min(0).max(100),
});

export const RelatedQuerySchema = z.object({
  query: z.string(),
  value: z.number(),
  type: z.enum(["top", "rising"]),
});

export const TrendsResponseSchema = z.object({
  trends: z.array(TrendPointSchema),
  interestByRegion: z.array(RegionInterestSchema),
  relatedQueries: z.array(RelatedQuerySchema),
});

export const NewsItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.string(),
  snippet: z.string().optional(),
  sourceBadge: z.enum(["GDELT", "GNews"]),
});

export const YouTubeItemSchema = z.object({
  title: z.string(),
  channel: z.string(),
  publishedAt: z.string(),
  url: z.string(),
  thumbnail: z.string(),
  videoId: z.string(),
});

export const SentimentDistributionSchema = z.object({
  positive: z.number().int().min(0),
  neutral: z.number().int().min(0),
  negative: z.number().int().min(0),
});

export const InsightsResponseSchema = z.object({
  sentiment: SentimentDistributionSchema,
  wordCloudTerms: z.array(
    z.object({
      text: z.string(),
      value: z.number(),
    })
  ),
  executiveSummary: z.string(),
  trendScore: z.number().min(0).max(100),
  momentum: z.number(),
  volatility: z.number().min(0),
  sourceDiversityIndex: z.number().int().min(0),
  freshnessScore: z.number().min(0).max(100),
});

// Inferred TypeScript types from Zod schemas
export type SearchParamsInput = z.infer<typeof SearchParamsSchema>;
export type TrendsResponseOutput = z.infer<typeof TrendsResponseSchema>;
export type InsightsResponseOutput = z.infer<typeof InsightsResponseSchema>;
