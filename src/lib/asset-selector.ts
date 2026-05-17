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

/**
 * Select a base asset for the character.
 *
 * When usedBaseCodes (FE-managed) is provided, it takes precedence over
 * the server-side character.used_base_numbers for determining which assets
 * have already been shown.
 *
 * Selection priority:
 * 1. Unused assets (exact gender match first, then N-gender fallback)
 * 2. Any candidate (all used — for cache-reuse round)
 */
export function selectBaseAsset(
  character: CharacterMeta,
  usedBaseCodes?: string[]
): BaseAsset | null {
  const assets = loadBaseAssets();

  // Candidates: exact gender + personality, with N-gender fallback
  const candidates = assets.filter(
    (a) =>
      a.personality === character.personality_type &&
      (a.gender === character.gender_type || a.gender === "N")
  );
  if (candidates.length === 0) return null;

  // Determine unused candidates
  const unused = usedBaseCodes
    ? candidates.filter((a) => !usedBaseCodes.includes(a.code))
    : candidates.filter((a) => !character.used_base_numbers.includes(a.number));

  if (unused.length > 0) {
    // Prefer exact gender match over N fallback
    const exactGender = unused.filter((a) => a.gender === character.gender_type);
    const pool = exactGender.length > 0 ? exactGender : unused;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // All candidates used — return random for cache-reuse round
  const exactGender = candidates.filter((a) => a.gender === character.gender_type);
  const pool = exactGender.length > 0 ? exactGender : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Check if all base assets for this character have been used.
 *
 * When usedBaseCodes (FE-managed) is provided, it takes precedence over
 * the server-side character.used_base_numbers.
 */
export function isExhausted(
  character: CharacterMeta,
  usedBaseCodes?: string[]
): boolean {
  const assets = loadBaseAssets();

  const candidates = assets.filter(
    (a) =>
      a.personality === character.personality_type &&
      (a.gender === character.gender_type || a.gender === "N")
  );

  if (usedBaseCodes) {
    return candidates.every((a) => usedBaseCodes.includes(a.code));
  }
  return candidates.every((a) =>
    character.used_base_numbers.includes(a.number)
  );
}
