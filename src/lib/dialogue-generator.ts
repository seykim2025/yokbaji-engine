import Anthropic from "@anthropic-ai/sdk";
import type { Personality } from "../types";
import {
  getSystemPrompt,
  getUserPrompt,
  getFallbackDialogue,
} from "../prompts/reaction-dialogue.prompts";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function generateDialogue(
  personalityType: Personality,
  baseAssetCode: string,
  userMessage: string
): Promise<string> {
  if (!client) {
    console.log(`[dialogue] No ANTHROPIC_API_KEY — using fallback for ${personalityType}`);
    return getFallbackDialogue(personalityType);
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: getSystemPrompt(personalityType),
      messages: [
        {
          role: "user",
          content: getUserPrompt(baseAssetCode, userMessage),
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) {
      console.warn(`[dialogue] Empty LLM response for ${personalityType}, using fallback`);
      return getFallbackDialogue(personalityType);
    }

    console.log(`[dialogue] LLM generated for ${personalityType}: "${text}"`);
    return text;
  } catch (err) {
    console.error("[dialogue] LLM call failed, using fallback:", err);
    return getFallbackDialogue(personalityType);
  }
}
