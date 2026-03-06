import { describe, it, expect } from "vitest";
import {
  computeTrendScore,
  computeMomentum,
  computeVolatility,
  computeFreshness,
  computeSlope,
} from "../lib/utils";

describe("computeSlope", () => {
  it("returns 0 for single value", () => {
    expect(computeSlope([50])).toBe(0);
  });

  it("returns positive slope for rising series", () => {
    expect(computeSlope([10, 20, 30, 40, 50])).toBeGreaterThan(0);
  });

  it("returns negative slope for declining series", () => {
    expect(computeSlope([50, 40, 30, 20, 10])).toBeLessThan(0);
  });

  it("returns ~0 for flat series", () => {
    const slope = computeSlope([40, 40, 40, 40, 40]);
    expect(Math.abs(slope)).toBeLessThan(0.001);
  });
});

describe("computeTrendScore", () => {
  it("returns 0 for empty array", () => {
    expect(computeTrendScore([])).toBe(0);
  });

  it("returns value in [0, 100]", () => {
    for (const arr of [
      [0, 0, 0],
      [100, 100, 100],
      [10, 20, 30, 40, 50],
      [80, 60, 40, 20, 10],
    ]) {
      const score = computeTrendScore(arr);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("gives higher score to high-value rising series", () => {
    const low = computeTrendScore([5, 6, 7, 8, 9]);
    const high = computeTrendScore([70, 75, 80, 85, 90]);
    expect(high).toBeGreaterThan(low);
  });
});

describe("computeMomentum", () => {
  it("returns 0 for empty or single-element array", () => {
    expect(computeMomentum([])).toBe(0);
    expect(computeMomentum([50])).toBe(0);
  });

  it("returns positive momentum when second half > first half", () => {
    expect(computeMomentum([10, 10, 20, 20])).toBeGreaterThan(0);
  });

  it("returns negative momentum when second half < first half", () => {
    expect(computeMomentum([80, 80, 40, 40])).toBeLessThan(0);
  });

  it("returns 0 for flat series", () => {
    expect(computeMomentum([50, 50, 50, 50])).toBe(0);
  });

  it("returns a percentage value based on half-period comparison", () => {
    const m = computeMomentum([10, 10, 50, 50]);
    // avg first half = 10, avg second half = 50 → (50-10)/10*100 = 400%
    expect(m).toBeCloseTo(400, 0);
  });
});

describe("computeVolatility", () => {
  it("returns 0 for empty or single-element array", () => {
    expect(computeVolatility([])).toBe(0);
    expect(computeVolatility([50])).toBe(0);
  });

  it("returns 0 for flat series", () => {
    expect(computeVolatility([40, 40, 40, 40])).toBe(0);
  });

  it("returns higher volatility for more variable series", () => {
    const stable = computeVolatility([48, 50, 52, 50]);
    const volatile_ = computeVolatility([10, 90, 10, 90]);
    expect(volatile_).toBeGreaterThan(stable);
  });

  it("returns non-negative value", () => {
    expect(computeVolatility([1, 50, 99, 25, 75])).toBeGreaterThan(0);
  });
});

describe("computeFreshness", () => {
  it("returns 0 for empty array", () => {
    expect(computeFreshness([])).toBe(0);
  });

  it("returns 100 when all items are fresh (now)", () => {
    const now = new Date().toISOString();
    expect(computeFreshness([now, now, now])).toBe(100);
  });

  it("returns 0 when all items are old (> 24h)", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness([old, old, old])).toBe(0);
  });

  it("returns 50 for half fresh, half old", () => {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness([now, now, old, old])).toBe(50);
  });
});
