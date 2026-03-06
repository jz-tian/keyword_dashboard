"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { SentimentDistribution } from "@/lib/types";

interface SentimentChartProps {
  sentiment: SentimentDistribution;
  theme: string;
}

interface RenderLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: RenderLabelProps) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export function SentimentChart({ sentiment, theme }: SentimentChartProps) {
  const isBloomberg = theme === "bloomberg";

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  const data = [
    {
      name: "Positive",
      value: sentiment.positive,
      color: isBloomberg ? "#22C55E" : "#34C759",
    },
    {
      name: "Neutral",
      value: sentiment.neutral,
      color: isBloomberg ? "#475569" : "#8E8E93",
    },
    {
      name: "Negative",
      value: sentiment.negative,
      color: isBloomberg ? "#EF4444" : "#FF3B30",
    },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4">Sentiment</CardTitle>
          <div className="flex h-36 items-center justify-center text-sm text-[var(--color-text-faint)]">
            No sentiment data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-3">Sentiment Distribution</CardTitle>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} items (${Math.round((value / total) * 100)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-card)",
                    fontSize: "11px",
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-text)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "var(--color-text-muted)" }}
                  itemStyle={{ color: "var(--color-text)" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Text summary */}
          <div className="mt-1 flex justify-center gap-4 text-xs text-[var(--color-text-faint)]">
            <span className="text-[var(--color-positive)]">
              +{Math.round((sentiment.positive / total) * 100)}%
            </span>
            <span className="text-[var(--color-text-faint)]">
              ~{Math.round((sentiment.neutral / total) * 100)}%
            </span>
            <span className="text-[var(--color-negative)]">
              -{Math.round((sentiment.negative / total) * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
