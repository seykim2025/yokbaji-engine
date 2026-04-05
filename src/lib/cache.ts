import * as fs from "fs";
import * as path from "path";
import type { CacheEntry, CacheIndex } from "../types";
import { getStorageDir } from "./paths";

const CACHE_INDEX_PATH = path.join(getStorageDir(), "cache-index.json");

function loadIndex(): CacheIndex {
  if (fs.existsSync(CACHE_INDEX_PATH)) {
    return JSON.parse(fs.readFileSync(CACHE_INDEX_PATH, "utf-8"));
  }
  return { entries: {} };
}

function saveIndex(index: CacheIndex): void {
  fs.mkdirSync(path.dirname(CACHE_INDEX_PATH), { recursive: true });
  fs.writeFileSync(CACHE_INDEX_PATH, JSON.stringify(index, null, 2));
}

function cacheKey(characterId: string, baseAssetCode: string): string {
  return `${characterId}:${baseAssetCode}`;
}

export function getCached(
  characterId: string,
  baseAssetCode: string
): CacheEntry | null {
  const index = loadIndex();
  const key = cacheKey(characterId, baseAssetCode);
  const entry = index.entries[key];
  if (!entry) return null;

  // Verify the file still exists
  if (!fs.existsSync(entry.video_path)) {
    delete index.entries[key];
    saveIndex(index);
    return null;
  }

  return entry;
}

export function setCached(entry: CacheEntry): void {
  const index = loadIndex();
  const key = cacheKey(entry.character_id, entry.base_asset_code);
  index.entries[key] = entry;
  saveIndex(index);
}

export function getCachedForCharacter(
  characterId: string
): CacheEntry[] {
  const index = loadIndex();
  const prefix = `${characterId}:`;
  return Object.entries(index.entries)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

export function getRandomCached(
  characterId: string
): CacheEntry | null {
  const entries = getCachedForCharacter(characterId);
  if (entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}
