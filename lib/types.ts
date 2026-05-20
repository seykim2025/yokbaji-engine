export type Personality = "WEAK" | "ANGRY" | "SARCASTIC" | "STOIC";
export type Gender = "M" | "F" | "N";
export type InputTag = "attack" | "complaint" | "tease" | "affection" | "praise" | "command" | "nonsense" | "blocked";

export interface DialogueEntry {
  id: string;
  personality_type: Personality;
  gender_type: Gender;
  input_tag: InputTag;
  intensity: number;
  lines: string[];
  base_asset_code?: string;
  voice_clip_key?: string;
}

export interface CharacterRecord {
  character_id: string;
  name: string;
  personality_type: Personality;
  gender_type: Gender;
  image_path: string;
  created_at: string;
}

export interface ReactionCacheEntry {
  video_url: string;
  dialogue: string;
  base_asset_code: string;
}

export interface TimingMeta {
  face_check_ms?: number;
  cache_check_ms?: number;
  external_api_ms?: number;
  asset_save_ms?: number;
  dialogue_generation_ms?: number;
  total_ms: number;
}

export interface ReactionResponse {
  ok: true;
  character_id: string;
  user_message: string;
  input_tag?: InputTag;
  intensity?: number;
  base_asset_code: string | null;
  video_url: string | null;
  cached: boolean;
  cache_key?: string;
  dialogue: string;
  dialogue_id?: string;
  personality_type: Personality;
  gender_type?: Gender;
  timing: TimingMeta;
}
