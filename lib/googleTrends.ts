/**
 * Google Trends API client — pure TypeScript, no Python dependency.
 * Mirrors the pytrends flow: cookies → explore widgets → data endpoints.
 */
import type { TrendPoint, RegionInterest, RelatedQuery } from "./types";

const BASE = "https://trends.google.com";

const UA_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const GEO_MAP: Record<string, string> = {
  worldwide: "",
  germany: "DE",
  us: "US",
};

const TF_MAP: Record<string, string> = {
  "24h": "now 1-d",
  "7d": "now 7-d",
  "30d": "today 1-m",
};

/** Strip the )]}', prefix Google prepends to all API responses */
function parseGoogleJson(text: string): unknown {
  const idx = Math.min(
    text.indexOf("{") === -1 ? Infinity : text.indexOf("{"),
    text.indexOf("[") === -1 ? Infinity : text.indexOf("[")
  );
  if (idx === Infinity) throw new Error("No JSON found in response");
  return JSON.parse(text.slice(idx));
}

async function getCookies(): Promise<string> {
  try {
    const res = await fetch(BASE, {
      headers: UA_HEADERS,
      signal: AbortSignal.timeout(5_000),
    });
    const raw = res.headers.get("set-cookie") ?? "";
    // Split on commas that start a new cookie (name=value pattern)
    return raw
      .split(/,(?=\s*\w+=)/)
      .map((c) => c.split(";")[0].trim())
      .join("; ");
  } catch {
    return "";
  }
}

interface Widget {
  id: string;
  token: string;
  request: unknown;
}

async function getWidgets(
  keyword: string,
  geo: string,
  timeframe: string,
  cookies: string
): Promise<Widget[]> {
  const req = JSON.stringify({
    comparisonItem: [{ keyword, geo, time: timeframe }],
    category: 0,
    property: "",
  });
  const params = new URLSearchParams({
    hl: "en-US",
    tz: "-60",
    req,
    cts: Date.now().toString(),
  });
  const res = await fetch(`${BASE}/trends/api/explore?${params}`, {
    headers: { ...UA_HEADERS, Cookie: cookies },
    signal: AbortSignal.timeout(8_000),
  });
  const text = await res.text();
  const data = parseGoogleJson(text) as { widgets?: Widget[] };
  return data.widgets ?? [];
}

async function fetchTimeSeries(
  w: Widget,
  cookies: string
): Promise<TrendPoint[]> {
  const params = new URLSearchParams({
    hl: "en-US",
    tz: "-60",
    req: JSON.stringify(w.request),
    token: w.token,
  });
  const res = await fetch(
    `${BASE}/trends/api/widgetdata/multiline?${params}`,
    { headers: { ...UA_HEADERS, Cookie: cookies }, signal: AbortSignal.timeout(8_000) }
  );
  const text = await res.text();
  const data = parseGoogleJson(text) as {
    default?: { timelineData?: Array<{ time: string; value: number[] }> };
  };
  return (data.default?.timelineData ?? []).map((d) => ({
    date: new Date(parseInt(d.time) * 1000).toISOString().slice(0, 10),
    value: d.value?.[0] ?? 0,
  }));
}

async function fetchRegion(
  w: Widget,
  cookies: string
): Promise<RegionInterest[]> {
  const params = new URLSearchParams({
    hl: "en-US",
    tz: "-60",
    req: JSON.stringify(w.request),
    token: w.token,
  });
  const res = await fetch(
    `${BASE}/trends/api/widgetdata/comparedgeo?${params}`,
    { headers: { ...UA_HEADERS, Cookie: cookies }, signal: AbortSignal.timeout(8_000) }
  );
  const text = await res.text();
  const data = parseGoogleJson(text) as {
    default?: { geoMapData?: Array<{ geoName: string; value: number[] }> };
  };
  return (data.default?.geoMapData ?? [])
    .map((d) => ({ region: d.geoName, value: d.value?.[0] ?? 0 }))
    .filter((d) => d.value > 0);
}

async function fetchRelated(
  w: Widget,
  cookies: string
): Promise<RelatedQuery[]> {
  const params = new URLSearchParams({
    hl: "en-US",
    tz: "-60",
    req: JSON.stringify(w.request),
    token: w.token,
  });
  const res = await fetch(
    `${BASE}/trends/api/widgetdata/relatedsearches?${params}`,
    { headers: { ...UA_HEADERS, Cookie: cookies }, signal: AbortSignal.timeout(8_000) }
  );
  const text = await res.text();
  const data = parseGoogleJson(text) as {
    default?: {
      rankedList?: Array<{
        rankedKeyword?: Array<{ query: string; value: number | string }>;
      }>;
    };
  };
  const results: RelatedQuery[] = [];
  const lists = data.default?.rankedList ?? [];
  for (const kw of lists[0]?.rankedKeyword?.slice(0, 10) ?? []) {
    results.push({ query: kw.query, value: typeof kw.value === "number" ? kw.value : 0, type: "top" });
  }
  for (const kw of lists[1]?.rankedKeyword?.slice(0, 10) ?? []) {
    results.push({ query: kw.query, value: typeof kw.value === "number" ? kw.value : 0, type: "rising" });
  }
  return results;
}

export async function fetchTrends(
  keyword: string,
  region: string,
  window: string
): Promise<{
  trends: TrendPoint[];
  interestByRegion: RegionInterest[];
  relatedQueries: RelatedQuery[];
}> {
  const geo = GEO_MAP[region] ?? "";
  const timeframe = TF_MAP[window] ?? "now 7-d";

  const cookies = await getCookies();
  const widgets = await getWidgets(keyword, geo, timeframe, cookies);

  const tsWidget = widgets.find((w) => w.id === "TIMESERIES");
  const geoWidget = widgets.find((w) => w.id === "GEO_MAP");
  const rqWidget = widgets.find(
    (w) => w.id === "RELATED_QUERIES" || w.id === "RELATED_TOPICS"
  );

  const [trends, interestByRegion, relatedQueries] = await Promise.all([
    tsWidget ? fetchTimeSeries(tsWidget, cookies) : Promise.resolve([]),
    geoWidget ? fetchRegion(geoWidget, cookies) : Promise.resolve([]),
    rqWidget ? fetchRelated(rqWidget, cookies) : Promise.resolve([]),
  ]);

  return { trends, interestByRegion, relatedQueries };
}
