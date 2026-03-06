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

function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.58;
}

function overlaps(
  x: number, y: number, w: number, h: number,
  rects: Array<{ x: number; y: number; w: number; h: number }>
): boolean {
  const pad = 5;
  for (const r of rects) {
    if (
      x < r.x + r.w + pad &&
      x + w + pad > r.x &&
      y < r.y + r.h + pad &&
      y + h + pad > r.y
    ) return true;
  }
  return false;
}

function computeLayout(
  terms: WordCloudTerm[],
  width: number,
  height: number,
  palette: string[]
): PlacedWord[] {
  if (terms.length === 0) return [];

  const maxVal = Math.max(...terms.map((t) => t.value));
  const minFont = 11;
  const maxFont = 52;
  const cx = width / 2;
  const cy = height / 2;

  const scaled = terms.slice(0, 50).map((t, i) => ({
    text: t.text,
    value: t.value,
    fontSize: Math.round(minFont + (t.value / maxVal) * (maxFont - minFont)),
    color: palette[i % palette.length],
  }));

  const placed: PlacedWord[] = [];
  const rects: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (const word of scaled) {
    const ww = estimateWidth(word.text, word.fontSize);
    const wh = word.fontSize * 1.25;

    // Archimedean spiral outward from center
    const maxSteps = 800;
    let didPlace = false;

    for (let step = 0; step < maxSteps; step++) {
      const theta = step * 0.18;
      const r = 2.2 * theta;
      const px = cx + r * Math.cos(theta) - ww / 2;
      const py = cy + r * Math.sin(theta) - wh / 2;

      if (px < 2 || px + ww > width - 2 || py < 2 || py + wh > height - 2) continue;

      if (!overlaps(px, py, ww, wh, rects)) {
        placed.push({ ...word, x: px, y: py });
        rects.push({ x: px, y: py, w: ww, h: wh });
        didPlace = true;
        break;
      }
    }

    if (!didPlace) continue; // skip word if no space found
  }

  return placed;
}

export function WordCloud({ terms, theme }: WordCloudProps) {
  const isBloomberg = theme === "bloomberg";
  const palette = isBloomberg ? BLOOMBERG_PALETTE : APPLE_PALETTE;

  const WIDTH = 560;
  const HEIGHT = 300;

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
              style={{ height: HEIGHT, maxHeight: HEIGHT }}
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
