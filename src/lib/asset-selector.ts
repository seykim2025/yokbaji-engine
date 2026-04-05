import * as fs from "fs";
import * as path from "path";
import type { BaseAsset, CharacterMeta, Gender, Personality } from "../types";
import { getProjectRoot, getAssetsDir } from "./paths";

const PROJECT_ROOT = getProjectRoot();
const ASSETS_DIR = path.join(getAssetsDir(), "base-videos");
const META_PATH = path.join(PROJECT_ROOT, "src/data/base-assets.json");

let _assets: BaseAsset[] | null = null;

export function loadBaseAssets(): BaseAsset[] {
  if (_assets) return _assets;

  // Try loading from JSON metadata first
  if (fs.existsSync(META_PATH)) {
    const raw = JSON.parse(fs.readFileSync(META_PATH, "utf-8")) as BaseAsset[];
    // Resolve relative video_path entries against project root
    _assets = raw.map((a) => ({
      ...a,
      video_path: path.isAbsolute(a.video_path)
        ? a.video_path
        : path.join(PROJECT_ROOT, a.video_path),
    }));
    return _assets;
  }

  // Scan assets directory for mp4 files matching {GENDER}_{PERSONALITY}_{NUMBER}.mp4
  _assets = [];
  if (!fs.existsSync(ASSETS_DIR)) {
    console.warn(`[asset-selector] Assets directory not found: ${ASSETS_DIR}`);
    return _assets;
  }

  const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".mp4"));
  const pattern = /^(M|F|N)_(WEAK|ANGRY|SARCASTIC|STOIC)_(\d{2})\.mp4$/;

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      _assets.push({
        code: file.replace(".mp4", ""),
        gender: match[1] as Gender,
        personality: match[2] as Personality,
        number: match[3],
        video_path: path.join(ASSETS_DIR, file),
      });
    }
  }

  return _assets;
}

export function selectBaseAsset(
  character: CharacterMeta
): BaseAsset | null {
  const assets = loadBaseAssets();

  // Filter by personality type and matching gender (with N fallback)
  const candidates = assets.filter(
    (a) =>
      a.personality === character.personality_type &&
      (a.gender === character.gender_type || a.gender === "N")
  );

  if (candidates.length === 0) return null;

  // Prefer assets not yet used by this character
  const unused = candidates.filter(
    (a) => !character.used_base_numbers.includes(a.number)
  );

  if (unused.length > 0) {
    // Prefer exact gender match over N fallback
    const exactMatch = unused.filter(
      (a) => a.gender === character.gender_type
    );
    const pool = exactMatch.length > 0 ? exactMatch : unused;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // All exhausted — return random from all candidates (for cache reuse)
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function isExhausted(character: CharacterMeta): boolean {
  const assets = loadBaseAssets();
  const candidates = assets.filter(
    (a) =>
      a.personality === character.personality_type &&
      (a.gender === character.gender_type || a.gender === "N")
  );
  return candidates.every((a) =>
    character.used_base_numbers.includes(a.number)
  );
}
