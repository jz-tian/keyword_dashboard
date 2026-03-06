/**
 * POST /api/insights
 * Body: InsightsRequestBody
 *
 * Pure TypeScript NLP — no Python sidecar required.
 * Handles sentiment analysis, word cloud extraction,
 * executive summary, and KPI metrics entirely in Node.js.
 */
import { NextRequest, NextResponse } from "next/server";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import { analyzeSentiment } from "@/lib/sentiment";
import { extractTerms, buildSummary } from "@/lib/nlp";
import {
  computeTrendScore,
  computeMomentum,
  computeVolatility,
  computeFreshness,
} from "@/lib/utils";
import type { InsightsRequestBody, InsightsResponse } from "@/lib/types";

function corpusHash(corpus: string[]): string {
  const str = corpus.slice(0, 30).join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: InsightsRequestBody;
  try {
    body = (await req.json()) as InsightsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parse = SearchParamsSchema.safeParse({
    keyword: body.keyword ?? "",
    region: body.region ?? "worldwide",
    window: body.window ?? "7d",
  });

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { keyword, region, window } = parse.data;
  const cacheKey = buildCacheKey(
    `insights_${corpusHash(body.corpus ?? [])}`,
    keyword,
    region,
    window
  );
  const ttl = getTtlForWindow(window);

  const cached = getCached<InsightsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  const corpus = body.corpus ?? [];
  const trends = body.trends ?? [];
  const relatedQueries = body.relatedQueries ?? [];
  const news = body.news ?? [];
  const youtube = body.youtube ?? [];

  // Language detection: use German NLP for Germany region
  const lang = region === "germany" ? "de" : "en";

  // Sentiment analysis
  const sentiment = analyzeSentiment(corpus, lang);

  // Word cloud
  const wordCloudTerms = extractTerms(corpus, lang);

  // Executive summary
  const executiveSummary = buildSummary(
    keyword,
    trends,
    relatedQueries,
    sentiment,
    news,
    youtube
  );

  // KPI metrics
  const trendValues = trends.map((t) => t.value ?? 0);
  const trendScore = computeTrendScore(trendValues);
  const momentum = computeMomentum(trendValues);
  const volatility = computeVolatility(trendValues);

  // Source diversity
  const sources = new Set<string>();
  for (const n of news) {
    const badge = (n as { sourceBadge?: string }).sourceBadge ?? "";
    if (badge) sources.add(badge);
  }
  if (youtube.length) sources.add("YouTube");

  // Freshness
  const allDates = [...news, ...youtube]
    .map((i) => (i as { publishedAt?: string }).publishedAt ?? "")
    .filter(Boolean);
  const freshnessScore = computeFreshness(allDates);

  const data: InsightsResponse = {
    sentiment,
    wordCloudTerms,
    executiveSummary,
    trendScore,
    momentum,
    volatility,
    sourceDiversityIndex: sources.size,
    freshnessScore,
  };

  setCached(cacheKey, data, ttl);
  return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
}
