/**
 * POST /api/insights
 * Body: InsightsRequestBody
 *
 * Proxies to FastAPI /insights endpoint which handles:
 *  - Sentiment analysis (EN/DE)
 *  - Word cloud term extraction
 *  - Deterministic executive summary
 *  - KPI metrics (trendScore, momentum, volatility, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import type { InsightsRequestBody, InsightsResponse } from "@/lib/types";

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:8000";

/** Compute a short deterministic hash of the corpus for cache keying */
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
  const cKey = `${corpusHash(body.corpus ?? [])}`;
  const cacheKey = buildCacheKey(`insights_${cKey}`, keyword, region, window);
  const ttl = getTtlForWindow(window);

  const cached = getCached<InsightsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const res = await fetch(`${PYTHON_API_URL}/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        region,
        window,
        corpus: body.corpus ?? [],
        trends: body.trends ?? [],
        news: body.news ?? [],
        youtube: body.youtube ?? [],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`FastAPI insights returned ${res.status}`);
    }

    const data = (await res.json()) as InsightsResponse;
    setCached(cacheKey, data, ttl);
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error("[/api/insights] Error:", err);

    // Graceful fallback — compute basic metrics client-side friendly values
    const fallback: InsightsResponse = {
      sentiment: { positive: 0, neutral: 1, negative: 0 },
      wordCloudTerms: [],
      executiveSummary:
        `Data for "${keyword}" could not be fully analyzed. ` +
        "The Python sidecar may be unavailable. " +
        "Start it with: cd python && uvicorn main:app --port 8000",
      trendScore: 0,
      momentum: 0,
      volatility: 0,
      sourceDiversityIndex: 0,
      freshnessScore: 0,
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
