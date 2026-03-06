"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

interface DemoModeBannerProps {
  onKeywordClick: (kw: string) => void;
}

const DEMOS = ["Finance", "Tesla", "Climate", "Tennis", "Bitcoin"];

export function DemoModeBanner({ onKeywordClick }: DemoModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] px-4 py-3 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
      <span className="text-[var(--color-text-muted)]">
        <strong className="text-[var(--color-accent)]">Demo mode.</strong>{" "}
        Enter any keyword or try:{" "}
        {DEMOS.map((kw, i) => (
          <span key={kw}>
            <button
              onClick={() => onKeywordClick(kw)}
              className="font-medium text-[var(--color-text)] underline-offset-2 hover:text-[var(--color-accent)] hover:underline transition-colors"
            >
              {kw}
            </button>
            {i < DEMOS.length - 1 && <span className="text-[var(--color-text-faint)]">, </span>}
          </span>
        ))}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto shrink-0 rounded p-0.5 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
