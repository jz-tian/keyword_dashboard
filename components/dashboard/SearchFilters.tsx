"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Region, TimeWindow } from "@/lib/types";

const DEMO_KEYWORDS = ["Finance", "Tesla", "Climate", "Tennis", "Bitcoin", "AI"];

const REGIONS: Array<{ value: Region; label: string }> = [
  { value: "worldwide", label: "Worldwide" },
  { value: "germany", label: "Germany" },
  { value: "us", label: "United States" },
];

const TIME_WINDOWS: Array<{ value: TimeWindow; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

interface SearchFiltersProps {
  isLoading: boolean;
  onSearch: (keyword: string, region: Region, window: TimeWindow) => void;
  defaultKeyword?: string;
  defaultRegion?: Region;
  defaultWindow?: TimeWindow;
}

export function SearchFilters({
  isLoading,
  onSearch,
  defaultKeyword = "",
  defaultRegion = "worldwide",
  defaultWindow = "7d",
}: SearchFiltersProps) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [window, setWindow] = useState<TimeWindow>(defaultWindow);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), region, window);
    }
  };

  const handleDemoClick = (kw: string) => {
    setKeyword(kw);
    onSearch(kw, region, window);
  };

  return (
    <aside className="flex flex-col gap-3 lg:gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Keyword — always full width */}
        <div className="flex flex-col gap-1.5">
          <label className="card-title !mb-0">Keyword</label>
          <div className="relative">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Finance, Tesla..."
              className="pr-8"
              autoComplete="off"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-faint)]" />
          </div>
        </div>

        {/* Region + Time Window — side by side on mobile, stacked on desktop */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {/* Region */}
          <div className="flex flex-col gap-1.5">
            <label className="card-title !mb-0">Region</label>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time window — segmented control */}
          <div className="flex flex-col gap-1.5">
            <label className="card-title !mb-0">Time Window</label>
            <div className="flex rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
              {TIME_WINDOWS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWindow(w.value)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    window === w.value
                      ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search button */}
        <Button type="submit" disabled={isLoading || !keyword.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {/* Demo keywords */}
      <div className="flex flex-col gap-1.5">
        <span className="card-title !mb-0">Try These</span>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => handleDemoClick(kw)}
              disabled={isLoading}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
