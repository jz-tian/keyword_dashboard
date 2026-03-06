"use client";

import { useState, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { fetchDashboardData } from "@/lib/api";
import type { DashboardData, Region, TimeWindow } from "@/lib/types";

import { Header } from "@/components/dashboard/Header";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { KPICards } from "@/components/dashboard/KPICards";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { RelatedTopics } from "@/components/dashboard/RelatedTopics";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { WordCloud } from "@/components/dashboard/WordCloud";
import { NewsList } from "@/components/dashboard/NewsList";
import { YouTubeList } from "@/components/dashboard/YouTubeList";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { DemoModeBanner } from "@/components/DemoModeBanner";

export default function HomePage() {
  const [theme, setTheme] = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentRegion, setCurrentRegion] = useState<Region>("worldwide");
  const [currentWindow, setCurrentWindow] = useState<TimeWindow>("7d");

  const handleSearch = useCallback(
    async (keyword: string, region: Region, window: TimeWindow) => {
      setIsLoading(true);
      setError(null);
      setCurrentKeyword(keyword);
      setCurrentRegion(region);
      setCurrentWindow(window);

      try {
        const result = await fetchDashboardData({ keyword, region, window });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "bloomberg" ? "apple" : "bloomberg");
  }, [theme, setTheme]);

  const isBloomberg = theme === "bloomberg";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <Header theme={theme} onThemeToggle={handleThemeToggle} />

      <div
        className={`flex flex-col lg:flex-row flex-1 gap-0 ${isBloomberg ? "lg:divide-x lg:divide-[var(--color-border)]" : ""}`}
      >
        {/* Sidebar — full width on mobile, fixed sidebar on desktop */}
        <div
          className={`w-full lg:shrink-0 ${
            isBloomberg
              ? "border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:w-56"
              : "p-4 lg:w-72 border-b lg:border-b-0 border-[var(--color-border)]"
          }`}
        >
          <SearchFilters
            isLoading={isLoading}
            onSearch={handleSearch}
            defaultRegion={currentRegion}
            defaultWindow={currentWindow}
          />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-auto">
          <div
            className={`flex flex-col gap-4 ${
              isBloomberg ? "p-3" : "p-4 lg:p-6"
            }`}
          >
            {/* Demo banner */}
            {!data && !isLoading && (
              <DemoModeBanner onKeywordClick={(kw) => handleSearch(kw, currentRegion, currentWindow)} />
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-[var(--radius-card)] border border-[var(--color-negative)]/30 bg-[var(--color-negative)]/10 p-4 text-sm text-[var(--color-negative)]">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && <DashboardSkeleton />}

            {/* Dashboard */}
            {!isLoading && data && (
              <>
                {/* Executive Summary */}
                <ExecutiveSummary
                  summary={data.insights.executiveSummary}
                  keyword={currentKeyword}
                />

                {/* KPI cards */}
                <KPICards insights={data.insights} />

                {/* Trend chart + Related topics */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <TrendChart
                    data={data.trends}
                    keyword={currentKeyword}
                    theme={theme}
                  />
                  <RelatedTopics queries={data.relatedQueries} />
                </div>

                {/* Sentiment + Word cloud */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SentimentChart sentiment={data.insights.sentiment} theme={theme} />
                  <WordCloud terms={data.insights.wordCloudTerms} theme={theme} />
                </div>

                {/* Interest by region — ranked list */}
                {data.interestByRegion.length > 0 && (
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--spacing-card)]">
                    <div className="card-title mb-3">Interest by Region (Top 10)</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {data.interestByRegion.slice(0, 10).map((r, i) => (
                        <div key={r.region} className="flex items-center gap-2">
                          <span className="w-4 shrink-0 text-[10px] text-[var(--color-text-faint)]">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 truncate text-xs text-[var(--color-text)]">
                              {r.region}
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                              <div
                                className="h-full rounded-full bg-[var(--color-accent)]"
                                style={{ width: `${r.value}%` }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] text-[var(--color-text-faint)]">
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* News */}
                <NewsList items={data.news} />

                {/* YouTube */}
                <YouTubeList items={data.youtube} />
              </>
            )}

            {/* Empty state after load with no results */}
            {!isLoading && !data && !error && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                >
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  Search for a keyword to begin
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Try Finance, Tesla, Climate, or any topic that interests you
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
