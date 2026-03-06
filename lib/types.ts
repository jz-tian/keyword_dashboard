// ──────────────────────────────────────────────────────────────
// Shared TypeScript types for Trend Intelligence Dashboard
// ──────────────────────────────────────────────────────────────

export type Region = "worldwide" | "germany" | "us";
export type TimeWindow = "24h" | "7d" | "30d";
export type SourceBadge = "GDELT" | "GNews" | "YouTube";

// ── Trend data ────────────────────────────────────────────────
export interface TrendPoint {
  date: string; // ISO date string e.g. "2024-05-01"
  value: number; // 0-100 Google Trends index
}

export interface RegionInterest {
  region: string; // country/region name
  value: number; // 0-100 interest index
}

export interface RelatedQuery {
  query: string;
  value: number; // 0-100 for "top", breakout % for "rising"
  type: "top" | "rising";
}

export interface TrendsResponse {
  trends: TrendPoint[];
  interestByRegion: RegionInterest[];
  relatedQueries: RelatedQuery[];
}

// ── News ──────────────────────────────────────────────────────
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO 8601 datetime string
  snippet?: string;
  sourceBadge: "GDELT" | "GNews";
}

// ── YouTube ───────────────────────────────────────────────────
export interface YouTubeItem {
  title: string;
  channel: string;
  publishedAt: string; // ISO 8601 datetime string
  url: string;
  thumbnail: string;
  videoId: string;
}

// ── Insights / Analytics ──────────────────────────────────────
export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface WordCloudTerm {
  text: string;
  value: number; // frequency / weight
}

export interface InsightsResponse {
  sentiment: SentimentDistribution;
  wordCloudTerms: WordCloudTerm[];
  executiveSummary: string;
  trendScore: number; // 0-100
  momentum: number; // % change (can be negative)
  volatility: number; // std dev of trend values
  sourceDiversityIndex: number; // count of distinct source types
  freshnessScore: number; // 0-100, % of items published in last 24h
}

// ── Combined dashboard state ──────────────────────────────────
export interface DashboardData {
  trends: TrendPoint[];
  interestByRegion: RegionInterest[];
  relatedQueries: RelatedQuery[];
  news: NewsItem[];
  youtube: YouTubeItem[];
  insights: InsightsResponse;
}

// ── API request params ────────────────────────────────────────
export interface SearchParams {
  keyword: string;
  region: Region;
  window: TimeWindow;
}

// ── Insights POST body ────────────────────────────────────────
export interface InsightsRequestBody {
  keyword: string;
  region: Region;
  window: TimeWindow;
  corpus: string[]; // titles from news + youtube
  trends: TrendPoint[];
  relatedQueries?: RelatedQuery[];
  news: Array<{ title: string; publishedAt: string; sourceBadge: string }>;
  youtube: Array<{ title: string; publishedAt: string }>;
}
