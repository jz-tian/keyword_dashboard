"use client";

import { motion } from "framer-motion";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

interface NewsListProps {
  items: NewsItem[];
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const badgeVariant = item.sourceBadge === "GDELT" ? "gdelt" : "gnews";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex-1 min-w-0">
        <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
          {item.title}
        </p>
        {item.snippet && (
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-faint)]">
            {truncate(item.snippet, 120)}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={badgeVariant}>{item.sourceBadge}</Badge>
          <span className="text-[10px] text-[var(--color-text-faint)]">
            {truncate(item.source, 30)}
          </span>
          <span className="ml-auto text-[10px] text-[var(--color-text-faint)]">
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      </div>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.a>
  );
}

export function NewsList({ items }: NewsListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4 flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5" />
            News
          </CardTitle>
          <div className="flex h-24 items-center justify-center text-sm text-[var(--color-text-faint)]">
            No news articles found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-[var(--spacing-card)]">
        <CardTitle className="mb-4 flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          News Headlines
          <span className="ml-auto font-normal text-[var(--color-text-faint)] normal-case tracking-normal">
            {items.length} articles
          </span>
        </CardTitle>
        <div className="flex flex-col gap-2">
          {items.slice(0, 15).map((item, i) => (
            <NewsCard key={item.url} item={item} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
