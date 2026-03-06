"use client";

import { motion } from "framer-motion";
import { ExternalLink, Play, Youtube } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { YouTubeItem } from "@/lib/types";

interface YouTubeListProps {
  items: YouTubeItem[];
}

function YouTubeCard({ item, index }: { item: YouTubeItem; index: number }) {
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="group flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-[calc(var(--radius-card)/2)] bg-[var(--color-surface-2)]">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-5 w-5 fill-white text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="youtube">
            <Youtube className="mr-1 h-2.5 w-2.5" />
            YouTube
          </Badge>
          <span className="truncate text-[10px] text-[var(--color-text-faint)]">
            {truncate(item.channel, 30)}
          </span>
          <span className="ml-auto shrink-0 text-[10px] text-[var(--color-text-faint)]">
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      </div>

      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.a>
  );
}

export function YouTubeList({ items }: YouTubeListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4 flex items-center gap-2">
            <Youtube className="h-3.5 w-3.5" />
            YouTube
          </CardTitle>
          <div className="flex h-24 items-center justify-center text-sm text-[var(--color-text-faint)]">
            No YouTube results found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-[var(--spacing-card)]">
        <CardTitle className="mb-4 flex items-center gap-2">
          <Youtube className="h-3.5 w-3.5 text-[var(--color-negative)]" />
          YouTube
          <span className="ml-auto font-normal text-[var(--color-text-faint)] normal-case tracking-normal">
            {items.length} videos
          </span>
        </CardTitle>
        <div className="flex flex-col gap-2">
          {items.slice(0, 10).map((item, i) => (
            <YouTubeCard key={item.videoId} item={item} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
