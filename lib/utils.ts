import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string as relative time (e.g. "2 hours ago") */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "unknown";

  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format a date string as short date (e.g. "May 1") */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Compute the linear slope of a series of values */
export function computeSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, v, i) => acc + i * v, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return isFinite(slope) ? slope : 0;
}

/** Compute trend score (0-100) from trend values */
export function computeTrendScore(values: number[]): number {
  if (values.length === 0) return 0;
  const recent = values.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const slope = computeSlope(values);
  const momentum = clamp(slope * 2, -20, 20);
  return clamp(Math.round(avg + momentum), 0, 100);
}

/** Compute momentum as % change between first half and second half */
export function computeMomentum(values: number[]): number {
  if (values.length < 2) return 0;
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  if (avg1 === 0) return 0;
  return parseFloat(((avg2 - avg1) / avg1 * 100).toFixed(1));
}

/** Compute volatility as standard deviation */
export function computeVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  return parseFloat(Math.sqrt(variance).toFixed(1));
}

/** Compute freshness score (0-100) from array of ISO timestamps */
export function computeFreshness(timestamps: string[]): number {
  if (timestamps.length === 0) return 0;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const fresh = timestamps.filter((t) => {
    const d = new Date(t).getTime();
    return !isNaN(d) && d > cutoff;
  }).length;
  return Math.round((fresh / timestamps.length) * 100);
}

/** Truncate text to maxLength with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/** Format a number with sign (e.g. +12.4 or -3.2) */
export function formatWithSign(n: number, decimals = 1): string {
  const fixed = Math.abs(n).toFixed(decimals);
  return n >= 0 ? `+${fixed}` : `-${fixed}`;
}
