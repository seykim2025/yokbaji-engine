import type { DialogueEntry, InputTag, Personality, Gender } from "./types";
import { DIALOGUE_DATA } from "./dialogue-data";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickFrom(candidates: DialogueEntry[], recentIds: string[]): DialogueEntry {
  const fresh = candidates.filter((d) => !recentIds.includes(d.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  return shuffle(pool)[0];
}

export function selectDialogue(
  personality: Personality,
  gender: Gender,
  input_tag: InputTag,
  recentDialogueIds: string[] = []
): DialogueEntry {
  const g = gender === "N" ? "M" : gender;

  // Exact match: personality + gender + input_tag
  const exact = DIALOGUE_DATA.filter(
    (d) => d.personality_type === personality && d.gender_type === g && d.input_tag === input_tag
  );
  if (exact.length > 0) return pickFrom(exact, recentDialogueIds);

  // Fallback 1: personality + input_tag, any gender
  const byTag = DIALOGUE_DATA.filter(
    (d) => d.personality_type === personality && d.input_tag === input_tag
  );
  if (byTag.length > 0) return pickFrom(byTag, recentDialogueIds);

  // Fallback 2: personality, any input_tag
  const byPersonality = DIALOGUE_DATA.filter((d) => d.personality_type === personality);
  if (byPersonality.length > 0) return pickFrom(byPersonality, recentDialogueIds);

  // Fallback 3: global (use any entry)
  return pickFrom(DIALOGUE_DATA, recentDialogueIds);
}
