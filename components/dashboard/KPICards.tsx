"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, Activity, Zap, BarChart2, Clock } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatWithSign } from "@/lib/utils";
import type { InsightsResponse } from "@/lib/types";

interface KPICardsProps {
  insights: InsightsResponse;
}

function TrendScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? "var(--color-positive)"
      : score >= 40
        ? "var(--color-accent)"
        : "var(--color-negative)";

  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
}

export function KPICards({ insights }: KPICardsProps) {
  const { trendScore, momentum, volatility, sourceDiversityIndex, freshnessScore, sentiment } = insights;

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  const dominantSentiment = total > 0
    ? Object.entries(sentiment).sort(([, a], [, b]) => b - a)[0]
    : ["neutral", 0];
  const sentimentLabel = (dominantSentiment[0] as string).charAt(0).toUpperCase() + (dominantSentiment[0] as string).slice(1);
  const sentimentPct = total > 0 ? Math.round(Number(dominantSentiment[1]) / total * 100) : 0;
  const sentimentColor =
    dominantSentiment[0] === "positive"
      ? "var(--color-positive)"
      : dominantSentiment[0] === "negative"
        ? "var(--color-negative)"
        : "var(--color-text-muted)";

  const MomentumIcon =
    momentum > 2 ? ArrowUpRight : momentum < -2 ? ArrowDownRight : Minus;
  const momentumColor =
    momentum > 2
      ? "var(--color-positive)"
      : momentum < -2
        ? "var(--color-negative)"
        : "var(--color-text-muted)";

  const cards = [
    {
      label: "Trend Score",
      icon: <Activity className="h-3.5 w-3.5" />,
      value: trendScore,
      suffix: "/100",
      extra: <TrendScoreBar score={trendScore} />,
      color:
        trendScore >= 70
          ? "var(--color-positive)"
          : trendScore >= 40
            ? "var(--color-accent)"
            : "var(--color-negative)",
    },
    {
      label: "Momentum",
      icon: <Zap className="h-3.5 w-3.5" />,
      value: formatWithSign(momentum),
      suffix: "%",
      extra: (
        <div className="mt-1 flex items-center gap-1" style={{ color: momentumColor }}>
          <MomentumIcon className="h-3.5 w-3.5" />
          <span className="text-xs">vs prev period</span>
        </div>
      ),
      color: momentumColor,
      raw: true,
    },
    {
      label: "Sentiment",
      icon: <BarChart2 className="h-3.5 w-3.5" />,
      value: sentimentLabel,
      suffix: ` ${sentimentPct}%`,
      extra: (
        <div className="mt-2 flex gap-1">
          {[
            { key: "positive", color: "var(--color-positive)" },
            { key: "neutral", color: "var(--color-text-muted)" },
            { key: "negative", color: "var(--color-negative)" },
          ].map(({ key, color }) => {
            const v = sentiment[key as keyof typeof sentiment];
            const pct = total > 0 ? (v / total) * 100 : 0;
            return (
              <div
                key={key}
                className="h-1 rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  minWidth: pct > 0 ? "2px" : 0,
                }}
              />
            );
          })}
        </div>
      ),
      color: sentimentColor,
      raw: true,
    },
    {
      label: "Freshness",
      icon: <Clock className="h-3.5 w-3.5" />,
      value: freshnessScore,
      suffix: "%",
      extra: (
        <div className="mt-1 text-xs text-[var(--color-text-faint)]">
          {sourceDiversityIndex} source{sourceDiversityIndex !== 1 ? "s" : ""} · σ {volatility}
        </div>
      ),
      color:
        freshnessScore >= 60
          ? "var(--color-positive)"
          : freshnessScore >= 30
            ? "var(--color-accent)"
            : "var(--color-text-muted)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.07, ease: "easeOut" }}
        >
          <Card className="h-full">
            <CardContent className="pt-[var(--spacing-card)]">
              <div
                className="mb-1 flex items-center gap-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {card.icon}
                <CardTitle>{card.label}</CardTitle>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="kpi-value" style={{ color: card.color }}>
                  {card.value}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">{card.suffix}</span>
              </div>
              {card.extra}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
