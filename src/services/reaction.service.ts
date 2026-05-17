import * as path from "path";
import { getCharacter, updateCharacter } from "./character.service";
import { selectBaseAsset, isExhausted } from "../lib/asset-selector";
import { getCached, setCached, getRandomCached } from "../lib/cache";
import { generateReactionVideo } from "../lib/replicate-client";
import { generateDialogue } from "../lib/dialogue-generator";
import { uploadFile, isUsingBlobStorage } from "../lib/blob-storage";
import type { ReactionRequest, ReactionResult } from "../types";
import { getStorageDir } from "../lib/paths";

const GENERATED_DIR = path.join(getStorageDir(), "generated");

export async function generateReaction(
  req: ReactionRequest
): Promise<ReactionResult> {
  const character = await getCharacter(req.character_id);
  if (!character) {
    throw new Error(`Character not found: ${req.character_id}`);
  }

  const { used_base_codes, cached_video_urls } = req;

  // 1. Select base asset (FE-provided used codes take precedence)
  const asset = selectBaseAsset(character, used_base_codes);
  if (!asset) {
    throw new Error(
      `No base assets found for ${character.personality_type}/${character.gender_type}`
    );
  }

  const exhausted = isExhausted(character, used_base_codes);
  let videoUrl: string;
  let cached = false;

  // 2. FE cache check — highest priority
  if (cached_video_urls && cached_video_urls[asset.code]) {
    videoUrl = cached_video_urls[asset.code];
    cached = true;
    console.log(`[reaction] FE cache hit: ${asset.code}`);
  } else if (exhausted && cached_video_urls) {
    // All 3 base actions exhausted — pick random from FE's cached URLs
    const urls = Object.values(cached_video_urls);
    if (urls.length > 0) {
      videoUrl = urls[Math.floor(Math.random() * urls.length)];
      cached = true;
      console.log(`[reaction] Exhausted, reusing FE-cached result`);
    } else {
      videoUrl = await resolveVideoUrl(character, asset, exhausted);
      cached = videoUrl !== "";
    }
  } else {
    videoUrl = await resolveVideoUrl(character, asset, exhausted);

    // Update server-side used_base_numbers when generating new
    if (!cached && !character.used_base_numbers.includes(asset.number)) {
      character.used_base_numbers.push(asset.number);
      character.generated_assets_count++;
      await updateCharacter(character);
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
    video_url: videoUrl,
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

/** Resolve video URL via server-side cache or Replicate generation. */
async function resolveVideoUrl(
  character: { character_id: string; image_path: string; personality_type: string; gender_type: string; used_base_numbers: string[]; generated_assets_count: number },
  asset: { code: string; video_path: string; number: string },
  exhausted: boolean
): Promise<string> {
  // Server-side cache check
  const cachedEntry = await getCached(character.character_id, asset.code);
  if (cachedEntry) {
    console.log(`[reaction] Server cache hit: ${asset.code}`);
    return cachedEntry.video_path;
  }

  // Exhausted with no specific cache for this asset — pick any cached result
  if (exhausted) {
    const randomCached = await getRandomCached(character.character_id);
    if (randomCached) {
      console.log(
        `[reaction] Exhausted, reusing server-cached: ${randomCached.base_asset_code}`
      );
      return randomCached.video_path;
    }
  }

  // Generate new via Replicate
  return callReplicateAndSave(character.character_id, character.image_path, asset);
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

  // Download the generated video from Replicate
  const response = await fetch(video_url);
  if (!response.ok) {
    throw new Error(
      `Failed to download video: ${response.status} ${response.statusText}`
    );
  }
  const videoBuffer = Buffer.from(await response.arrayBuffer());

  // Upload to persistent storage (Blob or local)
  const blobPath = `generated/${characterId}/${asset.code}.mp4`;
  const storedUrl = await uploadFile(blobPath, videoBuffer, "video/mp4");

  // Cache the result server-side
  await setCached({
    character_id: characterId,
    base_asset_code: asset.code,
    video_path: storedUrl,
    created_at: new Date().toISOString(),
  });

  return storedUrl;
}
