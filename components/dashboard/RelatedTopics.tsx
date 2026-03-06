"use client";

import { motion } from "framer-motion";
import { TrendingUp, Hash } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { RelatedQuery } from "@/lib/types";

interface RelatedTopicsProps {
  queries: RelatedQuery[];
}

function QueryList({
  queries,
  type,
  icon,
}: {
  queries: RelatedQuery[];
  type: "top" | "rising";
  icon: React.ReactNode;
}) {
  const filtered = queries.filter((q) => q.type === type).slice(0, 8);

  if (filtered.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-[var(--color-text-faint)]">
        No data
      </div>
    );
  }

  const maxVal = Math.max(...filtered.map((q) => q.value || 1));

  return (
    <div className="flex flex-col gap-1.5">
      {filtered.map((q, i) => (
        <motion.div
          key={q.query}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          className="group flex items-center gap-2"
        >
          <span className="w-4 shrink-0 text-[10px] text-[var(--color-text-faint)]">
            {i + 1}
          </span>
          <div className="relative flex-1 overflow-hidden">
            {/* Background bar */}
            {type === "top" && q.value > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-[var(--color-accent-dim)] transition-all"
                style={{ width: `${(q.value / maxVal) * 100}%` }}
              />
            )}
            <span className="relative text-xs text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
              {q.query}
            </span>
          </div>
          {type === "top" && q.value > 0 && (
            <span className="shrink-0 text-[10px] text-[var(--color-text-faint)]">
              {q.value}
            </span>
          )}
          {type === "rising" && (
            <span className="shrink-0 text-[10px] font-medium text-[var(--color-positive)]">
              ↑
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function RelatedTopics({ queries }: RelatedTopicsProps) {
  return (
    <Card className="h-full">
      <CardContent className="pt-[var(--spacing-card)]">
        <CardTitle className="mb-4">Related Queries</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Hash className="h-3 w-3" />
              Top
            </div>
            <QueryList queries={queries} type="top" icon={null} />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              <TrendingUp className="h-3 w-3" />
              Rising
            </div>
            <QueryList queries={queries} type="rising" icon={null} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
