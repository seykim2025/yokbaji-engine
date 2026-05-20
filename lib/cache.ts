// E-04: Cache hit/miss — in-process Map (no KV store provisioned)

import type { ReactionCacheEntry } from "./types";

const memStore = new Map<string, { value: string; expiresAt: number }>();
const KV_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function buildCacheKey(characterId: string, baseAssetCode: string): string {
  return `reaction:${characterId}:${baseAssetCode}`;
}

export async function cacheGet(key: string): Promise<ReactionCacheEntry | null> {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return JSON.parse(entry.value) as ReactionCacheEntry;
}

export async function cacheSet(key: string, value: ReactionCacheEntry): Promise<void> {
  memStore.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + KV_TTL_MS,
  });
}
