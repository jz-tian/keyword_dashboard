"use client";

import { motion } from "framer-motion";
import { BrainCircuit, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutiveSummaryProps {
  summary: string;
  keyword: string;
}

export function ExecutiveSummary({ summary, keyword }: ExecutiveSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-l-2 border-l-[var(--color-accent)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            Executive Summary
            <span className="ml-auto font-normal text-[var(--color-text-faint)] normal-case tracking-normal">
              {keyword}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {summary}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--color-text-faint)]">
            <TrendingUp className="h-3 w-3 text-[var(--color-accent)]" />
            <span>Generated deterministically from live data — no AI calls</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
