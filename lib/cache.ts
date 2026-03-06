/**
 * Unified file-based cache with in-memory fallback.
 * File-based cache writes to /data/cache/*.json with TTL.
 * Falls back to in-memory Map when filesystem is unavailable (e.g. Vercel read-only FS).
 */
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory fallback store
const memoryStore = new Map<string, CacheEntry<unknown>>();

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 200);
}

function ensureCacheDir(): boolean {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.accessSync(CACHE_DIR, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function getCached<T>(key: string): T | null {
  const safeKey = sanitizeKey(key);
  const now = Date.now();

  // Check memory cache first (fast path)
  const mem = memoryStore.get(safeKey);
  if (mem && mem.expiresAt > now) {
    return mem.data as T;
  }

  // Try file cache
  if (ensureCacheDir()) {
    const filePath = path.join(CACHE_DIR, `${safeKey}.json`);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (entry.expiresAt > now) {
        // Warm memory cache
        memoryStore.set(safeKey, entry as CacheEntry<unknown>);
        return entry.data;
      }
      // Expired — clean up
      fs.unlinkSync(filePath);
    } catch {
      // Cache miss or parse error
    }
  }

  return null;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  const safeKey = sanitizeKey(key);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const entry: CacheEntry<T> = { data, expiresAt };

  // Always write to memory
  memoryStore.set(safeKey, entry as CacheEntry<unknown>);

  // Try file cache
  if (ensureCacheDir()) {
    const filePath = path.join(CACHE_DIR, `${safeKey}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(entry), "utf-8");
    } catch {
      // Silently fall back to memory-only
    }
  }
}

/** TTL in seconds per time window */
export function getTtlForWindow(window: string): number {
  switch (window) {
    case "24h":
      return 600; // 10 minutes
    case "7d":
      return 1800; // 30 minutes
    case "30d":
      return 7200; // 2 hours
    default:
      return 600;
  }
}

/** Build a normalized cache key */
export function buildCacheKey(
  endpoint: string,
  keyword: string,
  region: string,
  window: string
): string {
  return `${endpoint}_${keyword.toLowerCase()}_${region}_${window}`;
}
