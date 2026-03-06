"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { WordCloudTerm } from "@/lib/types";

interface WordCloudProps {
  terms: WordCloudTerm[];
  theme: string;
}

interface PlacedWord {
  text: string;
  value: number;
  fontSize: number;
  x: number;
  y: number;
  color: string;
}

const BLOOMBERG_PALETTE = [
  "#F59E0B", "#EAB308", "#F97316", "#22C55E", "#94A3B8", "#CBD5E1",
  "#FBBF24", "#86EFAC", "#FED7AA", "#A3E635",
];

const APPLE_PALETTE = [
  "#0071E3", "#007AFF", "#5856D6", "#34C759", "#FF9500", "#FF2D55",
  "#AF52DE", "#30D158", "#64D2FF", "#0A84FF",
];

function computeLayout(
  terms: WordCloudTerm[],
  width: number,
  height: number,
  palette: string[]
): PlacedWord[] {
  if (terms.length === 0) return [];

  const maxVal = Math.max(...terms.map((t) => t.value));
  const minFont = 12;
  const maxFont = 42;

  // Scale font sizes
  const scaled = terms.slice(0, 40).map((t, i) => ({
    text: t.text,
    value: t.value,
    fontSize: minFont + ((t.value / maxVal) * (maxFont - minFont)),
    color: palette[i % palette.length],
  }));

  // Simple row-based layout (no overlap detection — good enough for word clouds)
  const placed: PlacedWord[] = [];
  const rows: Array<{ y: number; rightEdge: number; height: number }> = [];
  const padding = 6;
  const startY = 0;

  // Estimate char width: ~0.55 * fontSize
  function estimateWidth(text: string, fontSize: number): number {
    return text.length * fontSize * 0.55;
  }

  for (const word of scaled) {
    const ww = estimateWidth(word.text, word.fontSize);
    const wh = word.fontSize * 1.2;

    // Find a row with enough space
    let placed_ = false;
    for (const row of rows) {
      if (row.rightEdge + padding + ww <= width) {
        placed.push({
          ...word,
          x: row.rightEdge + padding,
          y: row.y,
        });
        row.rightEdge += padding + ww;
        placed_ = true;
        break;
      }
    }

    if (!placed_) {
      // New row
      const prevBottom =
        rows.length > 0 ? rows[rows.length - 1].y + rows[rows.length - 1].height : startY;
      const newY = prevBottom + padding;
      if (newY + wh > height) break; // Out of space
      rows.push({ y: newY, rightEdge: ww, height: wh });
      placed.push({
        ...word,
        x: 0,
        y: newY,
      });
    }
  }

  // Center each row
  for (const row of rows) {
    const wordsInRow = placed.filter((w) => w.y === row.y);
    const totalWidth = row.rightEdge;
    const offset = (width - totalWidth) / 2;
    for (const w of wordsInRow) {
      w.x += offset;
    }
  }

  return placed;
}

export function WordCloud({ terms, theme }: WordCloudProps) {
  const isBloomberg = theme === "bloomberg";
  const palette = isBloomberg ? BLOOMBERG_PALETTE : APPLE_PALETTE;

  const WIDTH = 560;
  const HEIGHT = 220;

  const words = useMemo(
    () => computeLayout(terms, WIDTH, HEIGHT, palette),
    [terms, palette]
  );

  if (terms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4">Word Cloud</CardTitle>
          <div className="flex h-36 items-center justify-center text-sm text-[var(--color-text-faint)]">
            No terms extracted
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-3">Word Cloud</CardTitle>
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full"
              style={{ height: HEIGHT }}
            >
              {words.map((word, i) => (
                <motion.text
                  key={word.text}
                  x={word.x}
                  y={word.y + word.fontSize}
                  fontSize={word.fontSize}
                  fill={word.color}
                  fontFamily="var(--font-sans)"
                  fontWeight={word.value > 60 ? "700" : word.value > 30 ? "600" : "400"}
                  opacity={0}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025, duration: 0.3 }}
                  style={{ cursor: "default", userSelect: "none" }}
                >
                  {word.text}
                </motion.text>
              ))}
            </svg>
          </div>
          <div className="mt-1 text-right text-[10px] text-[var(--color-text-faint)]">
            {terms.length} terms from news + YouTube corpus
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
