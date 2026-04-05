import type { Personality } from "../types";
import {
  buildDialoguePrompt,
  getFallbackDialogue,
} from "../prompts/reaction-dialogue.prompts";

export async function generateDialogue(
  personalityType: Personality,
  baseAssetCode: string,
  userMessage: string
): Promise<string> {
  // For MVP, use fallback dialogues.
  // When an LLM endpoint is available, use buildDialoguePrompt() to call it.
  // The prompt is ready — just need to wire it to an API (e.g., Claude, OpenAI).

  const prompt = buildDialoguePrompt(personalityType, baseAssetCode, userMessage);
  console.log(`[dialogue] Generated prompt (${prompt.length} chars) for ${personalityType}`);

  // TODO: Wire to LLM API for dynamic dialogue generation
  // For now, return personality-appropriate fallback
  return getFallbackDialogue(personalityType);
}
