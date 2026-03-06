"use client";

import { Github, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Theme } from "@/hooks/useTheme";

interface HeaderProps {
  theme: Theme;
  onThemeToggle: () => void;
}

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const isBloomberg = theme === "bloomberg";

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ backdropFilter: "blur(8px)" }}
    >
      <div className="flex h-12 items-center justify-between px-4 lg:px-6">
        {/* Logo / brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-accent)]"
          >
            <TrendingUp className="h-4 w-4 text-[var(--color-bg)]" strokeWidth={2.5} />
          </div>
          {isBloomberg ? (
            <span className="font-mono text-sm font-bold tracking-widest text-[var(--color-text)] uppercase">
              TREND<span className="text-[var(--color-accent)]">INTEL</span>
            </span>
          ) : (
            <span className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              Trend Intelligence
            </span>
          )}
          {isBloomberg && (
            <span className="ml-1 flex items-center gap-1 text-[10px] font-mono text-[var(--color-positive)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-positive)] animate-pulse" />
              LIVE
            </span>
          )}
          <span className="ml-2 hidden text-[11px] text-[var(--color-text-faint)] sm:block">
            by Jiazheng Tian
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <a
            href="https://github.com/jz-tian/keyword_dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
