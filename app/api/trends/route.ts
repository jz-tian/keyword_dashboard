import { NextRequest, NextResponse } from "next/server";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = getIpFromRequest(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Validate query params
  const { searchParams } = req.nextUrl;
  const parse = SearchParamsSchema.safeParse({
    keyword: searchParams.get("keyword") ?? "",
    region: searchParams.get("region") ?? "worldwide",
    window: searchParams.get("window") ?? "7d",
  });

  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { keyword, region, window } = parse.data;
  const cacheKey = buildCacheKey("trends", keyword, region, window);
  const ttl = getTtlForWindow(window);

  // Cache hit
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Proxy to FastAPI
  try {
    const url = `${PYTHON_API_URL}/trends?keyword=${encodeURIComponent(keyword)}&region=${region}&window=${window}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });

    if (!res.ok) {
      throw new Error(`FastAPI returned ${res.status}`);
    }

    const data = await res.json();
    setCached(cacheKey, data, ttl);

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("[/api/trends] Error:", err);
    // Return empty graceful fallback
    const fallback = { trends: [], interestByRegion: [], relatedQueries: [] };
    return NextResponse.json(fallback, { status: 200 });
  }
}
