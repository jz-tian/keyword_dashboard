/**
 * Client-side API helpers for fetching dashboard data.
 */
import type {
  DashboardData,
  InsightsRequestBody,
  InsightsResponse,
  NewsItem,
  SearchParams,
  TrendsResponse,
  YouTubeItem,
} from "./types";

function buildUrl(endpoint: string, params: SearchParams): string {
  const { keyword, region, window } = params;
  return `/api/${endpoint}?keyword=${encodeURIComponent(keyword)}&region=${region}&window=${window}`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${url} failed with ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTrends(params: SearchParams): Promise<TrendsResponse> {
  return fetchJson<TrendsResponse>(buildUrl("trends", params));
}

export async function fetchNews(params: SearchParams): Promise<NewsItem[]> {
  return fetchJson<NewsItem[]>(buildUrl("news", params));
}

export async function fetchYouTube(params: SearchParams): Promise<YouTubeItem[]> {
  return fetchJson<YouTubeItem[]>(buildUrl("youtube", params));
}

export async function fetchInsights(body: InsightsRequestBody): Promise<InsightsResponse> {
  return fetchJson<InsightsResponse>("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Fetch all dashboard data in parallel, then compute insights */
export async function fetchDashboardData(params: SearchParams): Promise<DashboardData> {
  const [trendsData, news, youtube] = await Promise.all([
    fetchTrends(params).catch((): TrendsResponse => ({
      trends: [],
      interestByRegion: [],
      relatedQueries: [],
    })),
    fetchNews(params).catch((): NewsItem[] => []),
    fetchYouTube(params).catch((): YouTubeItem[] => []),
  ]);

  const corpus = [
    ...news.map((n) => n.title),
    ...youtube.map((y) => y.title),
  ].filter(Boolean);

  const insightsBody: InsightsRequestBody = {
    keyword: params.keyword,
    region: params.region,
    window: params.window,
    corpus,
    trends: trendsData.trends,
    news: news.map((n) => ({
      title: n.title,
      publishedAt: n.publishedAt,
      sourceBadge: n.sourceBadge,
    })),
    youtube: youtube.map((y) => ({
      title: y.title,
      publishedAt: y.publishedAt,
    })),
  };

  const insights = await fetchInsights(insightsBody).catch(() => ({
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    wordCloudTerms: [],
    executiveSummary:
      "Unable to generate insights. Please check data sources and try again.",
    trendScore: 0,
    momentum: 0,
    volatility: 0,
    sourceDiversityIndex: 0,
    freshnessScore: 0,
  }));

  return {
    ...trendsData,
    news,
    youtube,
    insights,
  };
}
