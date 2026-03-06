/**
 * GET /api/news?keyword=&region=&window=
 *
 * Sources:
 *  1. GDELT 2.1 Doc API (primary)
 *  2. Google News RSS (fallback)
 *
 * Returns normalized NewsItem[].
 */
import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { buildCacheKey, getCached, getTtlForWindow, setCached } from "@/lib/cache";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { SearchParamsSchema } from "@/lib/schemas";
import type { NewsItem } from "@/lib/types";

const xmlParser = new XMLParser({ ignoreAttributes: false });

// ── GDELT ─────────────────────────────────────────────────────
function gdeltQuery(keyword: string, region: string): string {
  let q = encodeURIComponent(keyword);
  if (region === "germany") q += encodeURIComponent(" sourcelang:german");
  if (region === "us") q += encodeURIComponent(" sourcecountry:unitedstates");
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=25&format=json&sort=DateDesc`;
}

async function fetchGDELT(keyword: string, region: string): Promise<NewsItem[]> {
  const url = gdeltQuery(keyword, region);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`GDELT ${res.status}`);
  const json = (await res.json()) as { articles?: Array<Record<string, string>> };
  const articles = json.articles ?? [];
  return articles
    .filter((a) => a.title && a.url)
    .map((a) => ({
      title: a.title ?? "",
      url: a.url ?? "",
      source: a.domain ?? a.sourcecountry ?? "GDELT",
      publishedAt: parseGDELTDate(a.seendate ?? ""),
      snippet: a.socialimage ? undefined : undefined,
      sourceBadge: "GDELT" as const,
    }));
}

/** GDELT dates come as "20240501T123000Z" */
function parseGDELTDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  // e.g. "20240501T123000Z"
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  }
  return raw;
}

// ── GNews RSS ─────────────────────────────────────────────────
function gnewsUrl(keyword: string, region: string): string {
  const hl = region === "germany" ? "de" : "en-US";
  const gl = region === "germany" ? "DE" : "US";
  const ceid = region === "germany" ? "DE:de" : "US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

async function fetchGNews(keyword: string, region: string): Promise<NewsItem[]> {
  const url = gnewsUrl(keyword, region);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "TrendDashboard/1.0" },
  });
  if (!res.ok) throw new Error(`GNews RSS ${res.status}`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml) as {
    rss?: { channel?: { item?: unknown[] | unknown } };
  };

  const rawItems = parsed?.rss?.channel?.item;
  const items = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  return (items as Array<Record<string, unknown>>)
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: String(item.title ?? ""),
      url: String(item.link ?? ""),
      source: extractGNewsSource(item),
      publishedAt: item.pubDate ? new Date(String(item.pubDate)).toISOString() : new Date().toISOString(),
      snippet: item.description ? stripHtml(String(item.description)) : undefined,
      sourceBadge: "GNews" as const,
    }));
}

function extractGNewsSource(item: Record<string, unknown>): string {
  const src = item.source;
  if (typeof src === "object" && src !== null) {
    return String((src as Record<string, unknown>)["#text"] ?? "");
  }
  if (typeof src === "string") return src;
  return "Google News";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

// ── Dedup by URL ──────────────────────────────────────────────
function deduplicate(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

// ── Route handler ─────────────────────────────────────────────
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
  const cacheKey = buildCacheKey("news", keyword, region, window);
  const ttl = getTtlForWindow(window);

  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // Try GDELT first, fall back to GNews RSS
  let items: NewsItem[] = [];

  try {
    items = await fetchGDELT(keyword, region);
  } catch (err) {
    console.warn("[/api/news] GDELT failed, trying GNews RSS:", err);
  }

  if (items.length === 0) {
    try {
      items = await fetchGNews(keyword, region);
    } catch (err) {
      console.warn("[/api/news] GNews RSS failed:", err);
    }
  }

  // If still nothing, try GNews as supplement
  if (items.length > 0 && items.length < 10) {
    try {
      const supplement = await fetchGNews(keyword, region);
      items = [...items, ...supplement];
    } catch {
      // ignore
    }
  }

  const result = deduplicate(items)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 30);

  setCached(cacheKey, result, ttl);
  return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
}
