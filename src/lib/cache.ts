import * as fs from "fs";
import * as path from "path";
import type { CacheEntry, CacheIndex } from "../types";
import { getStorageDir } from "./paths";
import {
  uploadJson,
  downloadJson,
  listFiles,
  isUsingBlobStorage,
} from "./blob-storage";

const CACHE_INDEX_PATH = path.join(getStorageDir(), "cache-index.json");
const BLOB_CACHE_PATH = "cache-index.json";

// In-memory cache of the index to reduce reads
let _memoryIndex: CacheIndex | null = null;

async function loadIndex(): Promise<CacheIndex> {
  if (_memoryIndex) return _memoryIndex;

  if (isUsingBlobStorage()) {
    const files = await listFiles("cache-index");
    // cache-index.json is stored at the root level
    // Try direct download by finding the URL
    const allFiles = await listFiles("");
    const cacheUrl = allFiles.find((f) => f.endsWith("cache-index.json"));
    if (cacheUrl) {
      const index = await downloadJson<CacheIndex>(cacheUrl);
      if (index) {
        _memoryIndex = index;
        return index;
      }
    }
    _memoryIndex = { entries: {} };
    return _memoryIndex;
  }

  // Local fallback
  if (fs.existsSync(CACHE_INDEX_PATH)) {
    _memoryIndex = JSON.parse(fs.readFileSync(CACHE_INDEX_PATH, "utf-8"));
    return _memoryIndex!;
  }
  _memoryIndex = { entries: {} };
  return _memoryIndex;
}

async function saveIndex(index: CacheIndex): Promise<void> {
  _memoryIndex = index;

  if (isUsingBlobStorage()) {
    await uploadJson(BLOB_CACHE_PATH, index);
    return;
  }

  // Local fallback
  fs.mkdirSync(path.dirname(CACHE_INDEX_PATH), { recursive: true });
  fs.writeFileSync(CACHE_INDEX_PATH, JSON.stringify(index, null, 2));
}

function cacheKey(characterId: string, baseAssetCode: string): string {
  return `${characterId}:${baseAssetCode}`;
}

export async function getCached(
  characterId: string,
  baseAssetCode: string
): Promise<CacheEntry | null> {
  const index = await loadIndex();
  const key = cacheKey(characterId, baseAssetCode);
  const entry = index.entries[key];
  if (!entry) return null;

  // For blob storage, video_path is a URL — trust it exists
  if (isUsingBlobStorage()) {
    return entry;
  }

  // Local: verify the file still exists
  if (!fs.existsSync(entry.video_path)) {
    delete index.entries[key];
    await saveIndex(index);
    return null;
  }

  return entry;
}

export async function setCached(entry: CacheEntry): Promise<void> {
  const index = await loadIndex();
  const key = cacheKey(entry.character_id, entry.base_asset_code);
  index.entries[key] = entry;
  await saveIndex(index);
}

export async function getCachedForCharacter(
  characterId: string
): Promise<CacheEntry[]> {
  const index = await loadIndex();
  const prefix = `${characterId}:`;
  return Object.entries(index.entries)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

export async function getRandomCached(
  characterId: string
): Promise<CacheEntry | null> {
  const entries = await getCachedForCharacter(characterId);
  if (entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}
