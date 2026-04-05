import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { CharacterMeta, CharacterCreateRequest } from "../types";
import { getStorageDir } from "../lib/paths";
import {
  uploadFile,
  uploadJson,
  downloadJson,
  listFiles,
  isUsingBlobStorage,
} from "../lib/blob-storage";

const CHARACTERS_DIR = path.join(getStorageDir(), "characters");

function characterPath(characterId: string): string {
  return path.join(CHARACTERS_DIR, characterId, "meta.json");
}

export async function createCharacter(
  req: CharacterCreateRequest
): Promise<CharacterMeta> {
  const characterId = `char_${crypto.randomBytes(6).toString("hex")}`;
  const sessionId = `sess_${crypto.randomBytes(6).toString("hex")}`;

  // Read the uploaded image
  const imageBuffer = fs.readFileSync(req.image_path);
  const ext = path.extname(req.image_path) || ".jpg";
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  // Upload face image to storage
  const imageBlobPath = `characters/${characterId}/source${ext}`;
  const imageUrl = await uploadFile(imageBlobPath, imageBuffer, contentType);

  const meta: CharacterMeta = {
    character_id: characterId,
    session_id: sessionId,
    image_path: imageUrl,
    personality_type: req.personality_type,
    gender_type: req.gender_type,
    name: req.name,
    created_at: new Date().toISOString(),
    used_base_numbers: [],
    generated_assets_count: 0,
  };

  // Upload metadata
  const metaBlobPath = `characters/${characterId}/meta.json`;
  await uploadJson(metaBlobPath, meta);

  console.log(
    `[character] Created ${characterId} (${meta.personality_type}/${meta.gender_type}) [blob=${isUsingBlobStorage()}]`
  );
  return meta;
}

export async function getCharacter(
  characterId: string
): Promise<CharacterMeta | null> {
  if (isUsingBlobStorage()) {
    // List blobs with the character prefix and find meta.json
    const files = await listFiles(`characters/${characterId}/`);
    const metaUrl = files.find((f) => f.endsWith("meta.json"));
    if (!metaUrl) return null;
    return downloadJson<CharacterMeta>(metaUrl);
  }

  // Local fallback
  const p = characterPath(characterId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export async function updateCharacter(meta: CharacterMeta): Promise<void> {
  const metaBlobPath = `characters/${meta.character_id}/meta.json`;
  await uploadJson(metaBlobPath, meta);
}

export async function listCharacters(): Promise<CharacterMeta[]> {
  if (isUsingBlobStorage()) {
    // List all meta.json files under characters/
    const files = await listFiles("characters/");
    const metaUrls = files.filter((f) => f.endsWith("meta.json"));
    const results: CharacterMeta[] = [];
    for (const url of metaUrls) {
      const meta = await downloadJson<CharacterMeta>(url);
      if (meta) results.push(meta);
    }
    return results;
  }

  // Local fallback
  if (!fs.existsSync(CHARACTERS_DIR)) return [];
  return fs
    .readdirSync(CHARACTERS_DIR)
    .map((dir) => {
      const p = path.join(CHARACTERS_DIR, dir, "meta.json");
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, "utf-8")) as CharacterMeta;
    })
    .filter(Boolean) as CharacterMeta[];
}
