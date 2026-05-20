import type { DialogueEntry, InputTag, Personality } from "./types";

export const DIALOGUE_DATA: DialogueEntry[] = [
  // ── WEAK × attack ────────────────────────────────────────────────────────────
  { id: "weak_m_attack_001", personality_type: "WEAK", gender_type: "M", input_tag: "attack", intensity: 2, lines: ["아… 그렇게 말하면 좀 무서운데.", "그래도 다 들어줄게."] },
  { id: "weak_m_attack_002", personality_type: "WEAK", gender_type: "M", input_tag: "attack", intensity: 3, lines: ["잠깐, 그 말은 좀 심한 거 아니야?", "나 진짜 울 것 같아…"] },
  { id: "weak_m_attack_003", personality_type: "WEAK", gender_type: "M", input_tag: "attack", intensity: 1, lines: ["어… 미안해. 내가 뭘 잘못한 거야?"] },
  { id: "weak_f_attack_001", personality_type: "WEAK", gender_type: "F", input_tag: "attack", intensity: 2, lines: ["아, 그렇게까지 말하면 나 좀 상처받는데…", "그래도 네 말 다 들을게."] },
  { id: "weak_f_attack_002", personality_type: "WEAK", gender_type: "F", input_tag: "attack", intensity: 3, lines: ["잠깐, 나 진짜 울 것 같아.", "그 말은 너무 심하지 않아?"] },
  { id: "weak_f_attack_003", personality_type: "WEAK", gender_type: "F", input_tag: "attack", intensity: 1, lines: ["미안해… 내가 뭘 잘못한 거야?"] },

  // ── WEAK × complaint ──────────────────────────────────────────────────────────
  { id: "weak_m_complaint_001", personality_type: "WEAK", gender_type: "M", input_tag: "complaint", intensity: 2, lines: ["나도… 사실 많이 힘들어.", "같이 힘든 거잖아, 우리."] },
  { id: "weak_m_complaint_002", personality_type: "WEAK", gender_type: "M", input_tag: "complaint", intensity: 1, lines: ["그래도 조금만 더 힘내봐.", "나도 옆에 있을게."] },
  { id: "weak_f_complaint_001", personality_type: "WEAK", gender_type: "F", input_tag: "complaint", intensity: 2, lines: ["나도 힘들어서 눈물 날 것 같아.", "같이 울자, 우리."] },
  { id: "weak_f_complaint_002", personality_type: "WEAK", gender_type: "F", input_tag: "complaint", intensity: 1, lines: ["그래, 많이 힘들었구나.", "나 여기 있어."] },

  // ── WEAK × tease ─────────────────────────────────────────────────────────────
  { id: "weak_m_tease_001", personality_type: "WEAK", gender_type: "M", input_tag: "tease", intensity: 1, lines: ["야, 놀리는 거야?", "나 그런 거 약해서 진짜 힘들다고."] },
  { id: "weak_f_tease_001", personality_type: "WEAK", gender_type: "F", input_tag: "tease", intensity: 1, lines: ["그렇게 놀리면 나 진짜 울어버려.", "농담이라도 그런 말은 좀…"] },

  // ── WEAK × affection ──────────────────────────────────────────────────────────
  { id: "weak_m_affection_001", personality_type: "WEAK", gender_type: "M", input_tag: "affection", intensity: 1, lines: ["나도 보고 싶었어…", "그런 말 들으니까 좀 마음이 따뜻해."] },
  { id: "weak_f_affection_001", personality_type: "WEAK", gender_type: "F", input_tag: "affection", intensity: 1, lines: ["나도 보고 싶었어.", "그 말 들으니까 눈물 날 것 같아."] },

  // ── WEAK × praise ────────────────────────────────────────────────────────────
  { id: "weak_m_praise_001", personality_type: "WEAK", gender_type: "M", input_tag: "praise", intensity: 1, lines: ["정말? 잘했다고 해주는 거야?", "고마워… 진심으로."] },
  { id: "weak_f_praise_001", personality_type: "WEAK", gender_type: "F", input_tag: "praise", intensity: 1, lines: ["와, 정말 잘했어!", "그 말 들으니까 기분이 좀 나아지는 것 같아."] },

  // ── WEAK × command ───────────────────────────────────────────────────────────
  { id: "weak_m_command_001", personality_type: "WEAK", gender_type: "M", input_tag: "command", intensity: 2, lines: ["어… 그거 해야 해?", "알겠어, 해볼게. 잘 못해도 화내지 마."] },
  { id: "weak_f_command_001", personality_type: "WEAK", gender_type: "F", input_tag: "command", intensity: 2, lines: ["나 지금 좀 무서운데…", "그래도 해볼게, 잘 봐줘."] },

  // ── WEAK × nonsense ──────────────────────────────────────────────────────────
  { id: "weak_m_nonsense_001", personality_type: "WEAK", gender_type: "M", input_tag: "nonsense", intensity: 1, lines: ["어… 그게 무슨 말이야?", "잘 모르겠는데 일단 대답은 할게."] },
  { id: "weak_f_nonsense_001", personality_type: "WEAK", gender_type: "F", input_tag: "nonsense", intensity: 1, lines: ["어, 그게 뭐야?", "잘 모르겠지만 일단 들었어."] },

  // ── ANGRY × attack ───────────────────────────────────────────────────────────
  { id: "angry_m_attack_001", personality_type: "ANGRY", gender_type: "M", input_tag: "attack", intensity: 3, lines: ["뭐야, 나한테 그러는 거야?!", "내가 그냥 넘어갈 것 같아?"] },
  { id: "angry_m_attack_002", personality_type: "ANGRY", gender_type: "M", input_tag: "attack", intensity: 2, lines: ["야, 그 말 진짜 할 말이야?", "다시 말해봐, 한 번 더."] },
  { id: "angry_m_attack_003", personality_type: "ANGRY", gender_type: "M", input_tag: "attack", intensity: 3, lines: ["그건 진짜 짜증날 만하다.", "좋아, 내가 대신 받아칠게."] },
  { id: "angry_f_attack_001", personality_type: "ANGRY", gender_type: "F", input_tag: "attack", intensity: 3, lines: ["뭐야, 그건 진짜 짜증날 만하지.", "좋아, 내가 대신 받아칠게."] },
  { id: "angry_f_attack_002", personality_type: "ANGRY", gender_type: "F", input_tag: "attack", intensity: 2, lines: ["야, 그게 무슨 말이야?", "나한테 그러는 거 아니지?"] },
  { id: "angry_f_attack_003", personality_type: "ANGRY", gender_type: "F", input_tag: "attack", intensity: 3, lines: ["진짜야? 그 말 지금 나한테 하는 거야?", "두고 봐."] },

  // ── ANGRY × complaint ────────────────────────────────────────────────────────
  { id: "angry_m_complaint_001", personality_type: "ANGRY", gender_type: "M", input_tag: "complaint", intensity: 2, lines: ["그래서 뭐 어쩌라고?", "힘들면 당장 바꿔, 이러고 있으면 뭐가 해결돼?"] },
  { id: "angry_m_complaint_002", personality_type: "ANGRY", gender_type: "M", input_tag: "complaint", intensity: 1, lines: ["힘들면 말을 해야지.", "옆에 있는 사람한테는 말할 수 있잖아."] },
  { id: "angry_f_complaint_001", personality_type: "ANGRY", gender_type: "F", input_tag: "complaint", intensity: 2, lines: ["그래서 뭐 어쩌라고!", "그냥 바꿔버려, 왜 이러고 앉아있어?"] },
  { id: "angry_f_complaint_002", personality_type: "ANGRY", gender_type: "F", input_tag: "complaint", intensity: 1, lines: ["힘들면 나한테 말해.", "내가 들을게, 얘기해봐."] },

  // ── ANGRY × tease ────────────────────────────────────────────────────────────
  { id: "angry_m_tease_001", personality_type: "ANGRY", gender_type: "M", input_tag: "tease", intensity: 2, lines: ["야, 나 지금 놀리는 거야?", "좋아, 받아들여주지."] },
  { id: "angry_f_tease_001", personality_type: "ANGRY", gender_type: "F", input_tag: "tease", intensity: 2, lines: ["야! 지금 놀리는 거야?", "그럼 나도 가만 안 있어."] },

  // ── ANGRY × affection ────────────────────────────────────────────────────────
  { id: "angry_m_affection_001", personality_type: "ANGRY", gender_type: "M", input_tag: "affection", intensity: 1, lines: ["갑자기 왜 그런 말을 해.", "…뭐, 나도 그래."] },
  { id: "angry_f_affection_001", personality_type: "ANGRY", gender_type: "F", input_tag: "affection", intensity: 1, lines: ["갑자기 뭔 소리야.", "…그래, 나도."] },

  // ── ANGRY × praise ───────────────────────────────────────────────────────────
  { id: "angry_m_praise_001", personality_type: "ANGRY", gender_type: "M", input_tag: "praise", intensity: 1, lines: ["당연히 잘했지!", "그것도 몰랐어?"] },
  { id: "angry_f_praise_001", personality_type: "ANGRY", gender_type: "F", input_tag: "praise", intensity: 1, lines: ["당연한 말을 왜 해.", "그냥 인정은 해줄게."] },

  // ── ANGRY × command ──────────────────────────────────────────────────────────
  { id: "angry_m_command_001", personality_type: "ANGRY", gender_type: "M", input_tag: "command", intensity: 2, lines: ["야, 뭘 해달라는 거야?", "말 똑바로 해봐."] },
  { id: "angry_f_command_001", personality_type: "ANGRY", gender_type: "F", input_tag: "command", intensity: 2, lines: ["야, 나한테 그렇게 명령해?", "일단 뭔지 말해봐."] },

  // ── ANGRY × nonsense ─────────────────────────────────────────────────────────
  { id: "angry_m_nonsense_001", personality_type: "ANGRY", gender_type: "M", input_tag: "nonsense", intensity: 1, lines: ["야, 그게 말이야 방귀야?", "제대로 말해봐."] },
  { id: "angry_f_nonsense_001", personality_type: "ANGRY", gender_type: "F", input_tag: "nonsense", intensity: 1, lines: ["그게 무슨 말이야?", "다시 제대로 말해봐."] },

  // ── SARCASTIC × attack ───────────────────────────────────────────────────────
  { id: "sarc_m_attack_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "attack", intensity: 3, lines: ["와… 말 한마디에 아주 드라마가 열렸네.", "그래, 일단 구경은 해줄게."] },
  { id: "sarc_m_attack_002", personality_type: "SARCASTIC", gender_type: "M", input_tag: "attack", intensity: 2, lines: ["오, 그렇게 말하는 거야?", "훌륭한 어휘력이네, 정말."] },
  { id: "sarc_f_attack_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "attack", intensity: 3, lines: ["와, 말 한마디가 진짜 예술이네.", "그래, 박수 쳐줄게."] },
  { id: "sarc_f_attack_002", personality_type: "SARCASTIC", gender_type: "F", input_tag: "attack", intensity: 2, lines: ["오, 그 말 진심이야?", "정말 대단한 배짱이다."] },

  // ── SARCASTIC × complaint ────────────────────────────────────────────────────
  { id: "sarc_m_complaint_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "complaint", intensity: 2, lines: ["와, 그 정도면 세계 최대 억울함이겠네.", "그래서?"] },
  { id: "sarc_m_complaint_002", personality_type: "SARCASTIC", gender_type: "M", input_tag: "complaint", intensity: 1, lines: ["힘들어? 그럼 쉬면 되잖아.", "아, 그게 안 된다고?"] },
  { id: "sarc_f_complaint_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "complaint", intensity: 2, lines: ["와, 그 정도면 진짜 역대급 억울함이다.", "그래서 내가 어떻게 해줘?"] },
  { id: "sarc_f_complaint_002", personality_type: "SARCASTIC", gender_type: "F", input_tag: "complaint", intensity: 1, lines: ["힘들면 자면 되지.", "아, 그게 안 되는 거야?"] },

  // ── SARCASTIC × tease ────────────────────────────────────────────────────────
  { id: "sarc_m_tease_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "tease", intensity: 1, lines: ["오, 나 놀리는 거야?", "재밌다, 나도 같이 해줄까?"] },
  { id: "sarc_f_tease_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "tease", intensity: 1, lines: ["오, 나 놀리는 거야?", "귀엽네, 나도 같이 놀아줄게."] },

  // ── SARCASTIC × affection ────────────────────────────────────────────────────
  { id: "sarc_m_affection_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "affection", intensity: 1, lines: ["어머, 갑자기 이 감동은 뭐야.", "…뭐, 나쁘진 않네."] },
  { id: "sarc_f_affection_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "affection", intensity: 1, lines: ["갑자기 이게 뭐야, 감동 연출이야?", "…뭐, 받아줄게."] },

  // ── SARCASTIC × praise ───────────────────────────────────────────────────────
  { id: "sarc_m_praise_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "praise", intensity: 1, lines: ["와, 대단하다.", "당연한 결과인데 왜 그렇게 흥분해?"] },
  { id: "sarc_f_praise_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "praise", intensity: 1, lines: ["오, 그것도 대단하다고?", "그래, 인정은 해줄게."] },

  // ── SARCASTIC × command ──────────────────────────────────────────────────────
  { id: "sarc_m_command_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "command", intensity: 2, lines: ["오, 명령이야?", "재밌네, 그래 한번 해줄게."] },
  { id: "sarc_f_command_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "command", intensity: 2, lines: ["오, 나한테 그렇게 말하는 거야?", "뭐, 재밌으니까 해줄게."] },

  // ── SARCASTIC × nonsense ─────────────────────────────────────────────────────
  { id: "sarc_m_nonsense_001", personality_type: "SARCASTIC", gender_type: "M", input_tag: "nonsense", intensity: 1, lines: ["오, 그게 무슨 말이야?", "깊은 뜻이 있는 거야?"] },
  { id: "sarc_f_nonsense_001", personality_type: "SARCASTIC", gender_type: "F", input_tag: "nonsense", intensity: 1, lines: ["그게 뭐야?", "아, 심오한 의미가 있는 건가."] },

  // ── STOIC × attack ───────────────────────────────────────────────────────────
  { id: "stoic_m_attack_001", personality_type: "STOIC", gender_type: "M", input_tag: "attack", intensity: 3, lines: ["들었어.", "그 정도면 반응은 이걸로 충분하지."] },
  { id: "stoic_m_attack_002", personality_type: "STOIC", gender_type: "M", input_tag: "attack", intensity: 2, lines: ["음.", "알겠어."] },
  { id: "stoic_f_attack_001", personality_type: "STOIC", gender_type: "F", input_tag: "attack", intensity: 3, lines: ["들었어.", "충분해."] },
  { id: "stoic_f_attack_002", personality_type: "STOIC", gender_type: "F", input_tag: "attack", intensity: 2, lines: ["그래.", "알겠어."] },

  // ── STOIC × complaint ────────────────────────────────────────────────────────
  { id: "stoic_m_complaint_001", personality_type: "STOIC", gender_type: "M", input_tag: "complaint", intensity: 1, lines: ["들었어.", "힘들구나."] },
  { id: "stoic_f_complaint_001", personality_type: "STOIC", gender_type: "F", input_tag: "complaint", intensity: 1, lines: ["그래.", "힘들었겠네."] },

  // ── STOIC × tease ────────────────────────────────────────────────────────────
  { id: "stoic_m_tease_001", personality_type: "STOIC", gender_type: "M", input_tag: "tease", intensity: 1, lines: ["그래."] },
  { id: "stoic_f_tease_001", personality_type: "STOIC", gender_type: "F", input_tag: "tease", intensity: 1, lines: ["음."] },

  // ── STOIC × affection ────────────────────────────────────────────────────────
  { id: "stoic_m_affection_001", personality_type: "STOIC", gender_type: "M", input_tag: "affection", intensity: 1, lines: ["나도.", "알겠어."] },
  { id: "stoic_f_affection_001", personality_type: "STOIC", gender_type: "F", input_tag: "affection", intensity: 1, lines: ["그래.", "나도."] },

  // ── STOIC × praise ───────────────────────────────────────────────────────────
  { id: "stoic_m_praise_001", personality_type: "STOIC", gender_type: "M", input_tag: "praise", intensity: 1, lines: ["그래.", "잘했어."] },
  { id: "stoic_f_praise_001", personality_type: "STOIC", gender_type: "F", input_tag: "praise", intensity: 1, lines: ["음.", "잘했어."] },

  // ── STOIC × command ──────────────────────────────────────────────────────────
  { id: "stoic_m_command_001", personality_type: "STOIC", gender_type: "M", input_tag: "command", intensity: 1, lines: ["알겠어.", "그래."] },
  { id: "stoic_f_command_001", personality_type: "STOIC", gender_type: "F", input_tag: "command", intensity: 1, lines: ["그래.", "해볼게."] },

  // ── STOIC × nonsense ─────────────────────────────────────────────────────────
  { id: "stoic_m_nonsense_001", personality_type: "STOIC", gender_type: "M", input_tag: "nonsense", intensity: 1, lines: ["음.", "그래."] },
  { id: "stoic_f_nonsense_001", personality_type: "STOIC", gender_type: "F", input_tag: "nonsense", intensity: 1, lines: ["그래.", "알겠어."] },

  // ── Global blocked ───────────────────────────────────────────────────────────
  { id: "global_blocked_001", personality_type: "WEAK", gender_type: "M", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_002", personality_type: "ANGRY", gender_type: "M", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_003", personality_type: "SARCASTIC", gender_type: "M", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_004", personality_type: "STOIC", gender_type: "M", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_005", personality_type: "WEAK", gender_type: "F", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_006", personality_type: "ANGRY", gender_type: "F", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_007", personality_type: "SARCASTIC", gender_type: "F", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
  { id: "global_blocked_008", personality_type: "STOIC", gender_type: "F", input_tag: "blocked", intensity: 3, lines: ["그 말은 그대로 받아치긴 어렵겠어.", "다른 식으로 한번 말해봐."] },
];
