import type { InputTag } from "./types";

const BLOCKED_WORDS = ["살인", "자살", "폭탄", "테러", "죽여", "죽이", "강간", "성폭", "마약", "총기", "폭발물"];

const WORD_LISTS: Record<InputTag, string[]> = {
  attack: ["짜증", "꺼져", "싫어", "화나", "미쳐", "뭐야", "빡", "열받", "미친", "지랄", "닥쳐", "왜 그래", "왜그래", "너 진짜", "왜 이래"],
  complaint: ["힘들어", "억울", "피곤", "지쳐", "스트레스", "우울", "슬퍼", "속상", "괴로워", "외로워", "하기 싫어", "어떡해", "실망", "힘들다", "다 싫어"],
  tease: ["삐졌냐", "웃긴다", "장난", "놀리", "빵터", "웃겨", "ㅋㅋ", "ㅎㅎ", "ㅋ", "농담", "애교"],
  affection: ["보고싶어", "사랑해", "그립다", "생각나", "보고싶다", "좋아해", "보고 싶어", "귀엽다", "예쁘다"],
  praise: ["잘했지", "기분 좋다", "최고", "대박", "성공", "뿌듯", "해냈어", "나 진짜 잘", "나 멋지", "나 오늘 잘"],
  command: ["빨리 말해", "화내봐", "웃어봐", "해봐", "해줘", "빨리 해", "뭐라고 해", "반응해봐", "좀 해줘"],
  nonsense: [],
  blocked: [],
};

function countMatches(text: string, words: string[]): number {
  let count = 0;
  for (const w of words) {
    if (text.includes(w)) count++;
  }
  return count;
}

export function classifyInput(userText: string): { input_tag: InputTag; intensity: number } {
  const t = userText.toLowerCase();

  if (BLOCKED_WORDS.some((w) => t.includes(w))) {
    return { input_tag: "blocked", intensity: 3 };
  }

  if (t.trim().length <= 3 || !/[가-힣]/.test(t)) {
    return { input_tag: "nonsense", intensity: 1 };
  }

  const tags = (["attack", "complaint", "tease", "affection", "praise", "command"] as InputTag[]);
  let bestTag: InputTag = "complaint";
  let bestScore = 0;

  for (const tag of tags) {
    const s = countMatches(t, WORD_LISTS[tag]);
    if (s > bestScore) {
      bestScore = s;
      bestTag = tag;
    }
  }

  const intensity = Math.min(3, Math.max(1, bestScore === 0 ? 2 : bestScore));
  return { input_tag: bestTag, intensity };
}
