// POST /api/reactions
// E-01: Face check on character creation (not here — reactions use pre-validated characters)
// E-03: Timing metadata
// E-04: Cache hit/miss
// E-05: Standardized error codes

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Replicate from "replicate";
import { Timer } from "../lib/timing";
import { cacheGet, cacheSet, buildCacheKey } from "../lib/cache";
import { generateDialogue } from "../lib/dialogue";
import { classifyInput } from "../lib/input-classifier";
import { selectDialogue } from "../lib/dialogue-selector";
import { EngineError } from "../lib/errors";
import { getCharacterById } from "../lib/db";
import type { ReactionResponse } from "../lib/types";

const GENERATION_TIMEOUT_MS = 60_000;

const BASE_ASSET_POOL: Record<string, string[]> = {
  ANGRY:    ["M_ANGRY_01", "M_ANGRY_02", "M_ANGRY_03", "F_ANGRY_01", "F_ANGRY_02"],
  WEAK:     ["M_WEAK_01",  "M_WEAK_02",  "F_WEAK_01",  "F_WEAK_02"],
  SARCASTIC:["M_SARC_01",  "M_SARC_02",  "F_SARC_01"],
  STOIC:    ["M_STOI_01",  "F_STOI_01"],
};

function pickBaseAsset(personality: string, gender: string, recentCodes: string[] = []): string {
  const pool = BASE_ASSET_POOL[personality] ?? BASE_ASSET_POOL.STOIC;
  const prefix = gender === "N" ? "M" : gender;
  const filtered = pool.filter((c) => c.startsWith(prefix));
  const candidates = filtered.length > 0 ? filtered : pool;
  const fresh = candidates.filter((c) => !recentCodes.includes(c));
  const pool2 = fresh.length > 0 ? fresh : candidates;
  return pool2[Math.floor(Math.random() * pool2.length)];
}

function extractVideoUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string" && output.startsWith("http")) return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractVideoUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    for (const key of ["url", "video_url", "gif_url", "output", "video", "gif", "result"]) {
      const url = extractVideoUrl(obj[key]);
      if (url) return url;
    }
  }
  return null;
}

// Presets for zedge/live-portrait, keyed by personality prefix from baseAssetCode
const PERSONALITY_PRESETS: Record<string, string[]> = {
  ANGRY:     ["something_is_wrong_with_you", "dragostea_din_tei"],
  WEAK:      ["purrfect_day", "king_of_naps"],
  SARC:      ["summer_crush", "syncat_anthem"],
  STOI:      ["ten_little_indians", "muffin_man"],
};

function pickPreset(baseAssetCode: string): string {
  for (const [key, presets] of Object.entries(PERSONALITY_PRESETS)) {
    if (baseAssetCode.includes(key)) {
      return presets[Math.floor(Math.random() * presets.length)];
    }
  }
  return "dragostea_din_tei";
}

async function generateVideo(imageUrl: string, baseAssetCode: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.log("[video] REPLICATE_API_TOKEN not set — skipping video generation");
    return null;
  }

  const modelVersion = process.env.REPLICATE_MODEL_VERSION;
  if (!modelVersion) {
    console.log("[video] REPLICATE_MODEL_VERSION not set — skipping video generation");
    return null;
  }

  const replicate = new Replicate({ auth: token, useFileOutput: false });
  const preset = pickPreset(baseAssetCode);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  console.log(`[video] generating: model=${modelVersion} asset=${baseAssetCode} preset=${preset} image=${imageUrl.slice(0, 80)}`);

  try {
    const output = await replicate.run(
      modelVersion as `${string}/${string}:${string}`,
      { input: { source_image: imageUrl, preset } }
    );
    console.log("[video] raw output type:", typeof output, Array.isArray(output) ? "array" : "");
    console.log("[video] raw output:", JSON.stringify(output).slice(0, 500));
    const url = extractVideoUrl(output);
    console.log("[video] extracted url:", url ? url.slice(0, 80) : "null");
    return url;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new EngineError("GENERATION_TIMEOUT", "영상 생성 시간 초과");
    console.error("[video] Replicate error:", (err as Error).message);
    throw new EngineError("EXTERNAL_API_FAILED", "Replicate API 오류");
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const timer = new Timer();

  try {
    const body = req.body as {
      character_id?: string;
      user_message?: string;
      user_text?: string;
      recent_dialogue_ids?: string[];
      recent_base_asset_codes?: string[];
      used_base_codes?: string[];
    };

    const character_id = body.character_id;
    const rawText = body.user_text ?? body.user_message ?? "";
    if (!character_id || !rawText) {
      return res.status(400).json({ error: "character_id and user_text (or user_message) are required" });
    }

    const recentDialogueIds: string[] = body.recent_dialogue_ids ?? [];
    const recentBaseCodes: string[] = body.recent_base_asset_codes ?? body.used_base_codes ?? [];

    const character = await getCharacterById(character_id);
    if (!character) return res.status(404).json({ error: "Character not found" });

    // Classify input
    const { input_tag, intensity } = classifyInput(rawText);

    // Blocked path — return safe fallback without video
    if (input_tag === "blocked") {
      const entry = selectDialogue(character.personality_type, character.gender_type, "blocked", recentDialogueIds);
      const response: ReactionResponse = {
        ok: true,
        character_id,
        user_message: rawText,
        input_tag: "blocked",
        intensity,
        base_asset_code: null,
        video_url: null,
        cached: false,
        dialogue: entry.lines.join(" "),
        dialogue_id: entry.id,
        personality_type: character.personality_type,
        gender_type: character.gender_type,
        timing: timer.snapshot({}),
      };
      return res.json(response);
    }

    // Select base asset with recent avoidance
    const baseAssetCode = pickBaseAsset(character.personality_type, character.gender_type, recentBaseCodes);
    const cacheKey = buildCacheKey(character_id, baseAssetCode);

    // E-04: Cache check
    const cacheCheckStart = Date.now();
    const rawCached = await cacheGet(cacheKey);
    const cacheCheckMs = Date.now() - cacheCheckStart;
    const cached = rawCached?.video_url ? rawCached : null;
    if (rawCached && !cached) {
      console.log("[reaction] cache hit but video_url missing — treating as miss");
    }

    // Select dialogue from pre-written data (with LLM fallback)
    let dialogueText: string;
    let dialogueId: string | undefined;
    let dialogueMs = 0;

    const entry = selectDialogue(character.personality_type, character.gender_type, input_tag, recentDialogueIds);
    if (entry) {
      dialogueText = entry.lines.join(" ");
      dialogueId = entry.id;
    } else {
      const result = await generateDialogue(character.personality_type, character.gender_type, rawText);
      dialogueText = result.dialogue;
      dialogueMs = result.durationMs;
    }

    if (cached) {
      console.log("[reaction] cache hit with video_url:", cached.video_url.slice(0, 80));
      const response: ReactionResponse = {
        ok: true,
        character_id,
        user_message: rawText,
        input_tag,
        intensity,
        base_asset_code: cached.base_asset_code,
        video_url: cached.video_url,
        cached: true,
        cache_key: cacheKey,
        dialogue: dialogueText,
        dialogue_id: dialogueId,
        personality_type: character.personality_type,
        gender_type: character.gender_type,
        timing: timer.snapshot({ cache_check_ms: cacheCheckMs, dialogue_generation_ms: dialogueMs }),
      };
      return res.json(response);
    }

    // Cache miss — call Replicate
    console.log(`[reaction] cache miss — calling generateVideo for char=${character_id} asset=${baseAssetCode}`);
    const externalStart = Date.now();
    const videoUrl = await generateVideo(character.image_path, baseAssetCode);
    const externalApiMs = Date.now() - externalStart;
    console.log("[reaction] videoUrl result:", videoUrl ? videoUrl.slice(0, 80) : "null");

    let assetSaveMs = 0;
    if (videoUrl) {
      const t = Date.now();
      try {
        await cacheSet(cacheKey, { video_url: videoUrl, dialogue: "", base_asset_code: baseAssetCode });
        assetSaveMs = Date.now() - t;
      } catch {
        throw new EngineError("ASSET_SAVE_FAILED", "결과 저장 실패");
      }
    }

    const response: ReactionResponse = {
      ok: true,
      character_id,
      user_message: rawText,
      input_tag,
      intensity,
      base_asset_code: baseAssetCode,
      video_url: videoUrl ?? null,
      cached: false,
      dialogue: dialogueText,
      dialogue_id: dialogueId,
      personality_type: character.personality_type,
      gender_type: character.gender_type,
      timing: timer.snapshot({
        cache_check_ms: cacheCheckMs,
        external_api_ms: externalApiMs,
        asset_save_ms: assetSaveMs,
        dialogue_generation_ms: dialogueMs,
      }),
    };
    return res.json(response);
  } catch (err) {
    if (err instanceof EngineError) return res.status(422).json(err.toResponse());
    console.error("[reactions] error:", err);
    return res.status(500).json(new EngineError("UNKNOWN_ERROR", "알 수 없는 오류").toResponse());
  }
}
