import { NextRequest, NextResponse } from "next/server";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import { fetchTrends } from "@/lib/googleTrends";

export async function GET(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

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

  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const data = await fetchTrends(keyword, region, window);
    setCached(cacheKey, data, ttl);
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error("[/api/trends] Error:", err);
    return NextResponse.json(
      { trends: [], interestByRegion: [], relatedQueries: [] },
      { status: 200 }
    );
  }
}
