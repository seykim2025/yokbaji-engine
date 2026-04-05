import * as path from "path";
import { getCharacter, updateCharacter } from "./character.service";
import { selectBaseAsset, isExhausted } from "../lib/asset-selector";
import { getCached, setCached, getRandomCached } from "../lib/cache";
import {
  generateReactionVideo,
  downloadVideo,
} from "../lib/replicate-client";
import { generateDialogue } from "../lib/dialogue-generator";
import type { ReactionRequest, ReactionResult } from "../types";
import { getStorageDir } from "../lib/paths";

const GENERATED_DIR = path.join(getStorageDir(), "generated");

export async function generateReaction(
  req: ReactionRequest
): Promise<ReactionResult> {
  const character = getCharacter(req.character_id);
  if (!character) {
    throw new Error(`Character not found: ${req.character_id}`);
  }

  // 1. Select base asset
  const asset = selectBaseAsset(character);
  if (!asset) {
    throw new Error(
      `No base assets found for ${character.personality_type}/${character.gender_type}`
    );
  }

  const exhausted = isExhausted(character);
  let videoPath: string;
  let cached = false;

  // 2. Check cache
  const cachedEntry = getCached(character.character_id, asset.code);

  if (cachedEntry) {
    // Cache hit — reuse
    videoPath = cachedEntry.video_path;
    cached = true;
    console.log(`[reaction] Cache hit: ${asset.code}`);
  } else if (exhausted) {
    // All base assets exhausted — reuse random cached result
    const randomCached = getRandomCached(character.character_id);
    if (randomCached) {
      videoPath = randomCached.video_path;
      cached = true;
      console.log(`[reaction] Exhausted, reusing cached: ${randomCached.base_asset_code}`);
    } else {
      // No cache at all, must generate even if exhausted
      videoPath = await callReplicateAndSave(character.character_id, character.image_path, asset);
    }
  } else {
    // Generate new
    videoPath = await callReplicateAndSave(character.character_id, character.image_path, asset);

    // Update used_base_numbers
    if (!character.used_base_numbers.includes(asset.number)) {
      character.used_base_numbers.push(asset.number);
      character.generated_assets_count++;
      updateCharacter(character);
    }
  }

  // 3. Generate dialogue
  const dialogue = await generateDialogue(
    character.personality_type,
    asset.code,
    req.user_message
  );

  const result: ReactionResult = {
    character_id: character.character_id,
    base_asset_code: asset.code,
    video_url: videoPath,
    cached,
    dialogue,
    personality_type: character.personality_type,
    created_at: new Date().toISOString(),
  };

  console.log(
    `[reaction] Result: ${asset.code} | cached=${cached} | dialogue="${dialogue}"`
  );

  return result;
}

async function callReplicateAndSave(
  characterId: string,
  imagePath: string,
  asset: { code: string; video_path: string }
): Promise<string> {
  console.log(`[reaction] Generating via Replicate: ${asset.code}`);

  const { video_url } = await generateReactionVideo({
    source_image_path: imagePath,
    driving_video_path: asset.video_path,
  });

  // Download and save locally
  const destPath = path.join(
    GENERATED_DIR,
    characterId,
    `${asset.code}.mp4`
  );
  await downloadVideo(video_url, destPath);

  // Cache the result
  setCached({
    character_id: characterId,
    base_asset_code: asset.code,
    video_path: destPath,
    created_at: new Date().toISOString(),
  });

  return destPath;
}
