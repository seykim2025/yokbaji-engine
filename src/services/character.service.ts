import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { CharacterMeta, CharacterCreateRequest } from "../types";
import { getStorageDir } from "../lib/paths";

const CHARACTERS_DIR = path.join(getStorageDir(), "characters");

function characterPath(characterId: string): string {
  return path.join(CHARACTERS_DIR, characterId, "meta.json");
}

export function createCharacter(req: CharacterCreateRequest): CharacterMeta {
  const characterId = `char_${crypto.randomBytes(6).toString("hex")}`;
  const sessionId = `sess_${crypto.randomBytes(6).toString("hex")}`;
  const charDir = path.join(CHARACTERS_DIR, characterId);

  fs.mkdirSync(charDir, { recursive: true });

  // Copy source image to character directory
  const ext = path.extname(req.image_path) || ".jpg";
  const destImage = path.join(charDir, `source${ext}`);
  fs.copyFileSync(req.image_path, destImage);

  const meta: CharacterMeta = {
    character_id: characterId,
    session_id: sessionId,
    image_path: destImage,
    personality_type: req.personality_type,
    gender_type: req.gender_type,
    name: req.name,
    created_at: new Date().toISOString(),
    used_base_numbers: [],
    generated_assets_count: 0,
  };

  fs.writeFileSync(characterPath(characterId), JSON.stringify(meta, null, 2));
  console.log(`[character] Created ${characterId} (${meta.personality_type}/${meta.gender_type})`);
  return meta;
}

export function getCharacter(characterId: string): CharacterMeta | null {
  const p = characterPath(characterId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function updateCharacter(meta: CharacterMeta): void {
  fs.writeFileSync(characterPath(meta.character_id), JSON.stringify(meta, null, 2));
}

export function listCharacters(): CharacterMeta[] {
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
