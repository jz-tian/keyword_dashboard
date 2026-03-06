/**
 * GET /api/youtube?keyword=&region=&window=
 *
 * Uses ytsr (YouTube scraper, no API key required).
 * Falls back gracefully if scraping fails.
 *
 * Returns normalized YouTubeItem[].
 */
import { NextRequest, NextResponse } from "next/server";
const ytsr = require("ytsr") as {
  (query: string, options: { limit: number; safeSearch: boolean }): Promise<{
    items: Array<{
      type: string;
      id?: string;
      title?: string;
      author?: { name?: string } | null;
      uploadedAt?: string | null;
      bestThumbnail?: { url?: string } | null;
    }>;
  }>;
};

import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import type { YouTubeItem } from "@/lib/types";

/** Parse "6 months ago" / "3 years ago" etc. into a rough ISO timestamp */
function parseYouTubeDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const now = Date.now();
  const m = raw.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!m) return new Date(now).toISOString();
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const ms: Record<string, number> = {
    second: 1_000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return new Date(now - n * (ms[unit] ?? 0)).toISOString();
}

async function fetchYouTubeItems(keyword: string): Promise<YouTubeItem[]> {
  const result = await ytsr(keyword, { limit: 25, safeSearch: false });
  return result.items
    .filter((item) => item.type === "video" && item.id && item.title)
    .slice(0, 15)
    .map((item) => ({
      videoId: item.id!,
      title: item.title!,
      channel: item.author?.name ?? "Unknown",
      publishedAt: parseYouTubeDate(item.uploadedAt),
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail: item.bestThumbnail?.url ?? "",
    }));
}

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
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { keyword, region, window } = parse.data;

  // Optionally localise query for German region
  const regionSuffix: Record<string, string> = { germany: " DE", us: "", worldwide: "" };
  const searchQuery = keyword + (regionSuffix[region] ?? "");

  const cacheKey = buildCacheKey("youtube", keyword, region, window);
  const ttl = getTtlForWindow(window);

  const cached = getCached<YouTubeItem[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const items = await fetchYouTubeItems(searchQuery);
    setCached(cacheKey, items, ttl);
    return NextResponse.json(items, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.warn("[/api/youtube] ytsr failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
