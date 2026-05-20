// Dialogue generation via Anthropic Claude (ANTHROPIC_API_KEY auto-injected)

import Anthropic from "@anthropic-ai/sdk";
import type { Personality, Gender } from "./types";
import { EngineError } from "./errors";

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  WEAK:      "너는 심약하고 눈물 많고 쉽게 상처받는 성격이야. 상대방의 말에 울며 애원하는 반응을 해.",
  ANGRY:     "너는 버럭버럭 화를 잘 내고 공격적인 성격이야. 상대방의 말에 강하게 맞받아치는 반응을 해.",
  SARCASTIC: "너는 비꼬기를 즐기고 냉소적인 성격이야. 상대방의 말을 날카롭게 조롱하는 반응을 해.",
  STOIC:     "너는 무덤덤하고 냉정한 성격이야. 상대방의 말에 거의 반응하지 않고 짧게 답해.",
};

const GENDER_HINTS: Record<Gender, string> = {
  M: "남성 말투를 사용해.",
  F: "여성 말투를 사용해.",
  N: "중립적인 말투를 사용해.",
};

const TIMEOUT_MS = 10_000;
const FALLBACKS: Record<Personality, string> = {
  WEAK:      "…그게 정말이야? 나 좀 울 것 같아.",
  ANGRY:     "야, 그게 할 말이야?! 다시 말해봐.",
  SARCASTIC: "와, 정말 그런 말을 할 수 있는 게 신기하네.",
  STOIC:     "그래.",
};

export async function generateDialogue(
  personalityType: Personality,
  genderType: Gender,
  userMessage: string
): Promise<{ dialogue: string; durationMs: number }> {
  const t0 = Date.now();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { dialogue: FALLBACKS[personalityType], durationMs: Date.now() - t0 };
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = [
    PERSONALITY_PROMPTS[personalityType],
    GENDER_HINTS[genderType],
    "한국어로 2~4문장 이내로 짧게 대답해. 욕설은 사용하지 않되 감정을 강하게 표현해.",
  ].join(" ");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    const content = message.content[0];
    const dialogue = content.type === "text" ? content.text.trim() : FALLBACKS[personalityType];
    return { dialogue, durationMs: Date.now() - t0 };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new EngineError("GENERATION_TIMEOUT", "대사 생성 시간 초과");
    if (err instanceof EngineError) throw err;
    // API failure — fall back to hardcoded dialogue so the reaction still works
    // Log only message, never the error object (which may contain the API key in cause)
    console.error("[dialogue] Anthropic API error, using fallback:", err instanceof Error ? err.message : "unknown");
    return { dialogue: FALLBACKS[personalityType], durationMs: Date.now() - t0 };
  } finally {
    clearTimeout(timeout);
  }
}
