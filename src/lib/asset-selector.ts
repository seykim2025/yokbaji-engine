import * as fs from "fs";
import * as path from "path";
import type { BaseAsset, CharacterMeta, Gender, Personality } from "../types";
import { getProjectRoot, getAssetsDir } from "./paths";

const PROJECT_ROOT = getProjectRoot();
const ASSETS_DIR = path.join(getAssetsDir(), "base-videos");
const META_PATH = path.join(PROJECT_ROOT, "src/data/base-assets.json");

/**
 * Temporary fallback flag.
 * Set to true once all 36 base videos are ready.
 * When true, strict gender matching is enforced and the personality-first fallback is removed.
 */
const ASSETS_FULLY_STOCKED = false;

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

export function selectBaseAsset(character: CharacterMeta): BaseAsset | null {
  const assets = loadBaseAssets();

  if (ASSETS_FULLY_STOCKED) {
    // Strict mode: exact gender + personality, with N-gender fallback
    const candidates = assets.filter(
      (a) =>
        a.personality === character.personality_type &&
        (a.gender === character.gender_type || a.gender === "N")
    );
    if (candidates.length === 0) return null;
    const unused = candidates.filter(
      (a) => !character.used_base_numbers.includes(a.number)
    );
    if (unused.length > 0) {
      const exactMatch = unused.filter((a) => a.gender === character.gender_type);
      const pool = exactMatch.length > 0 ? exactMatch : unused;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // --- Temporary personality-first fallback (remove when ASSETS_FULLY_STOCKED = true) ---
  // Step 1: Prefer exact gender + personality match
  const exactCandidates = assets.filter(
    (a) =>
      a.personality === character.personality_type &&
      a.gender === character.gender_type
  );
  const exactUnused = exactCandidates.filter(
    (a) => !character.used_base_numbers.includes(a.number)
  );
  if (exactUnused.length > 0) {
    return exactUnused[Math.floor(Math.random() * exactUnused.length)];
  }
  if (exactCandidates.length > 0) {
    // All exact-gender assets used — cycle through them for cache reuse
    return exactCandidates[Math.floor(Math.random() * exactCandidates.length)];
  }

  // Step 2: Personality-first fallback — same personality, any gender
  // e.g. N_SARCASTIC_01 requested but only F_SARCASTIC_01 exists → use F_SARCASTIC_01
  const personalityCandidates = assets.filter(
    (a) => a.personality === character.personality_type
  );
  if (personalityCandidates.length === 0) return null;

  const personalityUnused = personalityCandidates.filter(
    (a) => !character.used_base_numbers.includes(a.number)
  );
  const pool =
    personalityUnused.length > 0 ? personalityUnused : personalityCandidates;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  console.log(
    `[asset-selector] fallback: no ${character.gender_type}_${character.personality_type} assets available, ` +
      `using ${selected.code} (personality-first fallback, active until 36 base videos are ready)`
  );

  return selected;
}

export function isExhausted(character: CharacterMeta): boolean {
  const assets = loadBaseAssets();

  if (ASSETS_FULLY_STOCKED) {
    const candidates = assets.filter(
      (a) =>
        a.personality === character.personality_type &&
        (a.gender === character.gender_type || a.gender === "N")
    );
    return candidates.every((a) =>
      character.used_base_numbers.includes(a.number)
    );
  }

  // During fallback period, exhaustion checks all personality-matched assets
  const candidates = assets.filter(
    (a) => a.personality === character.personality_type
  );
  return candidates.every((a) =>
    character.used_base_numbers.includes(a.number)
  );
}
