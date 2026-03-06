/**
 * GET /api/youtube?keyword=&region=&window=
 *
 * Uses Invidious public API instances (keyless YouTube alternative).
 * Falls back through a list of known public instances.
 *
 * Returns normalized YouTubeItem[].
 */
import { NextRequest, NextResponse } from "next/server";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import type { YouTubeItem } from "@/lib/types";

// Public Invidious instances (in preference order)
const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://invidious.nerdvpn.de",
  "https://invidious.privacydev.net",
  "https://vid.puffyan.us",
  "https://invidious.lunar.icu",
];

interface InvidiousVideo {
  videoId: string;
  title: string;
  author: string;
  authorId: string;
  published: number; // Unix timestamp
  videoThumbnails: Array<{ quality: string; url: string; width: number; height: number }>;
  viewCount: number;
  description?: string;
}

function selectThumbnail(thumbnails: InvidiousVideo["videoThumbnails"]): string {
  const pref = ["medium", "high", "default", "sddefault", "maxresdefault"];
  for (const quality of pref) {
    const t = thumbnails.find((x) => x.quality === quality);
    if (t?.url) return t.url;
  }
  return thumbnails[0]?.url ?? "";
}

async function fetchFromInstance(
  instance: string,
  keyword: string
): Promise<YouTubeItem[]> {
  const url = `${instance}/api/v1/search?q=${encodeURIComponent(keyword)}&type=video&sort_by=upload_date&page=1`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "TrendDashboard/1.0" },
  });

  if (!res.ok) throw new Error(`Invidious ${instance} returned ${res.status}`);

  const videos = (await res.json()) as InvidiousVideo[];
  if (!Array.isArray(videos)) throw new Error("Unexpected response shape");

  return videos
    .filter((v) => v.videoId && v.title)
    .slice(0, 15)
    .map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channel: v.author ?? "Unknown",
      publishedAt: new Date(v.published * 1000).toISOString(),
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      thumbnail: selectThumbnail(v.videoThumbnails ?? []),
    }));
}

async function fetchYouTubeItems(keyword: string): Promise<YouTubeItem[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const items = await fetchFromInstance(instance, keyword);
      if (items.length > 0) return items;
    } catch (err) {
      console.warn(`[/api/youtube] Instance ${instance} failed:`, err);
    }
  }
  return [];
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
  const cacheKey = buildCacheKey("youtube", keyword, region, window);
  const ttl = getTtlForWindow(window);

  const cached = getCached<YouTubeItem[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // Optionally append region hint to query for better results
  const regionHint: Record<string, string> = {
    germany: " Deutschland",
    us: "",
    worldwide: "",
  };
  const searchKeyword = keyword + (regionHint[region] ?? "");

  const items = await fetchYouTubeItems(searchKeyword);
  setCached(cacheKey, items, ttl);

  return NextResponse.json(items, { headers: { "X-Cache": "MISS" } });
}
