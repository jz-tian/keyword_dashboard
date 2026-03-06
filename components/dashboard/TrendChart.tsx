"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendPoint[];
  keyword: string;
  theme: string;
}

interface TooltipEntry {
  payload?: { date?: string; value?: number };
}

interface TooltipPayload {
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ payload, label }: TooltipPayload & { active?: boolean }) {
  const item = payload?.[0];
  if (!item) return null;
  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-lg"
    >
      <p className="text-[var(--color-text-muted)]">{label || item?.payload?.date}</p>
      <p className="font-bold text-[var(--color-accent)]">
        {item?.payload?.value ?? 0} / 100
      </p>
    </div>
  );
}

export function TrendChart({ data, keyword, theme }: TrendChartProps) {
  const isBloomberg = theme === "bloomberg";
  const accentColor = isBloomberg ? "#F59E0B" : "#0071E3";
  const gridColor = isBloomberg ? "#1E1E2E" : "#E5E7EB";

  // Compute mean for reference line
  const mean = useMemo(() => {
    if (data.length === 0) return null;
    return Math.round(data.reduce((a, b) => a + b.value, 0) / data.length);
  }, [data]);

  const chartData = data.map((d) => ({
    ...d,
    date: formatShortDate(d.date),
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4">Trend Over Time</CardTitle>
          <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-faint)]">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <CardTitle className="mb-4 flex items-center justify-between">
            <span>Trend Over Time</span>
            <span className="font-normal text-[var(--color-text-faint)] normal-case tracking-normal">
              {keyword} · Google Trends
            </span>
          </CardTitle>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--color-text-faint)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "var(--color-text-faint)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {mean !== null && (
                  <ReferenceLine
                    y={mean}
                    stroke="var(--color-text-faint)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={accentColor}
                  strokeWidth={isBloomberg ? 1.5 : 2}
                  dot={false}
                  activeDot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {mean !== null && (
            <div className="mt-1 text-right text-[10px] text-[var(--color-text-faint)]">
              avg {mean}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
