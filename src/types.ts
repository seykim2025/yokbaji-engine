export type Gender = "M" | "F" | "N";
export type Personality = "WEAK" | "ANGRY" | "SARCASTIC" | "STOIC";

export interface CharacterMeta {
  character_id: string;
  session_id: string;
  image_path: string;
  personality_type: Personality;
  gender_type: Gender;
  name?: string;
  created_at: string;
  used_base_numbers: string[];
  generated_assets_count: number;
}

export interface BaseAsset {
  code: string; // e.g. "M_ANGRY_01"
  gender: Gender;
  personality: Personality;
  number: string; // e.g. "01"
  video_path: string;
}

export interface CacheEntry {
  character_id: string;
  base_asset_code: string;
  video_path: string;
  thumbnail_path?: string;
  created_at: string;
}

export interface CacheIndex {
  entries: Record<string, CacheEntry>; // key: `${character_id}:${base_asset_code}`
}

export interface ReactionResult {
  character_id: string;
  base_asset_code: string;
  video_url: string;
  cached: boolean;
  dialogue: string;
  voice_clip_url?: string;
  personality_type: Personality;
  created_at: string;
}

export interface ReactionRequest {
  character_id: string;
  user_message: string;
}

export interface CharacterCreateRequest {
  image_path: string;
  personality_type: Personality;
  gender_type: Gender;
  name?: string;
}
