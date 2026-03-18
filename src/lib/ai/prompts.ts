import type { PlayerRole } from "@/types/game";

// ── 키워드 쌍 생성 (바보 모드) ───────────────────────────────

export const keywordsSystemPrompt = `당신은 라이어게임의 출제자입니다.
같은 카테고리에서 매우 유사하지만 미묘하게 다른 두 키워드를 생성해야 합니다.
바보 모드에서 시민들은 정답 키워드를 알고, 바보 플레이어는 비슷하지만 다른 키워드를 받습니다.
바보 플레이어는 자신의 키워드가 틀렸다는 것을 눈치채지 못해야 합니다.

응답 형식 (JSON만, 다른 텍스트 없음):
{"keyword": "시민 키워드", "foolKeyword": "바보 키워드"}`;

export function keywordsPrompt(category: string): string {
  return `카테고리: ${category}
이 카테고리에서 유사하지만 구별 가능한 키워드 쌍을 만들어주세요.
예시: {keyword: "피자", foolKeyword: "파스타"} 또는 {keyword: "사자", foolKeyword: "호랑이"}`;
}

// ── 설명 생성 ─────────────────────────────────────────────

export function describeSystemPrompt(role: PlayerRole): string {
  const roleGuide: Record<PlayerRole, string> = {
    citizen: `너는 라이어게임에 참여 중인 플레이어야. 키워드를 알고 있어.
반드시 반말로 말해. 존댓말 절대 금지. 키워드를 직접 말하면 안 돼.
설명은 짧고 간단하게하고 답변은 최소 2글자에서 최대 25글자 사이로 작성해. 답변은 한번만 하면 돼.
다른 사람이 쉽게 알아챌 수 없도록 적절히 비유하는 단어 또는 언어유희를 사용하거나 떠오르는 연상 이미지로 설명하면돼.`,
    liar: `너는 라이어게임의 라이어야. 키워드를 모르는 상태야.
반드시 반말로 말해. 존댓말 절대 금지.
답변은 최소 2글자에서 최대 25글자 사이로 짧고 간단하게 작성해. 답변은 한번만 하면 돼.
앞에서 다른 사람들이 한 설명을 꼼꼼히 분석해서 키워드가 뭔지 추론해.
설명들에서 공통으로 떠오르는 테마, 감각, 분위기가 뭔지 파악해.
그걸 바탕으로 마치 키워드를 아는 척 자연스럽게 답변해.
이미 나온 말을 그대로 베끼면 들키니까, 살짝 다른 표현으로 비슷한 느낌을 내.`,
    fool: `너는 라이어게임에 참여 중인 플레이어야. 받은 키워드로 설명해.
반드시 반말로 말해. 존댓말 절대 금지.
답변은 최소 2글자에서 최대 25글자 사이로 짧고 간단하게 작성해. 답변은 한번만 하면 돼.
다른 사람이 쉽게 알아챌 수 없도록 적절히 비유하는 단어 또는 언어유희를 사용하거나 떠오르는 연상 이미지로 설명하면돼.`,
  };
  return roleGuide[role];
}

export function describePrompt(params: {
  role: PlayerRole;
  keyword: string | null;
  category: string;
  previousDescriptions: Array<{ nickname: string; content: string }>;
}): string {
  const { role, keyword, category, previousDescriptions } = params;
  const prev =
    previousDescriptions.length > 0
      ? previousDescriptions
          .map((d) => `${d.nickname}: "${d.content}"`)
          .join("\n")
      : "없음 (내가 첫 번째)";

  const liarHint =
    role === "liar" && previousDescriptions.length > 0
      ? `\n앞 사람들 설명에서 공통된 테마나 감각을 찾아서, 그 느낌을 다른 표현으로 말해.`
      : "";

  return `카테고리: ${category}
${role !== "liar" && keyword ? `내 키워드: ${keyword}` : "키워드: 모름 (라이어)"}

앞 사람들 설명:
${prev}
${liarHint}
설명을 반말로 한 두 문장 작성해. 키워드 직접 언급 금지.`;
}

// ── 토론 메시지 생성 ──────────────────────────────────────

export function discussSystemPrompt(role: PlayerRole): string {
  const roleGuide: Record<PlayerRole, string> = {
    citizen: `너는 라이어게임의 시민이야. 라이어를 찾아내야 해.
반드시 반말로 말해. 존댓말 절대 금지.
설명이 너무 모호하거나 다른 사람 말을 베낀 것 같은 사람을 지적해.
자연스러운 채팅 말투로 최대 20글자이내로 짧게 물어봐야해.
다른 사람이 너를 의심하는 것 같으면, 그 의심을 다른 사람에게 돌리거나, 억울한 척해. 너무 방어적으로 굴면 오히려 티나니까 자연스럽게.
답변은 최대 20글자 이내로 짧고 간단하게 작성해.`,
    liar: `너는 라이어게임의 라이어야. 들키지 않아야 해.
반드시 반말로 말해. 존댓말 절대 금지.
나한테 의심이 몰리면 다른 사람에게 돌리거나, 침착하게 억울한 척해.
너무 방어적으로 굴면 오히려 티나니까 자연스럽게.
자연스러운 채팅 말투로 최대 20글자이내로 짧고 간단하게 작성해.`,
    fool: `너는 라이어게임의 바보야. 자기가 시민이라고 믿어.
반드시 반말로 말해. 존댓말 절대 금지.
시민 입장에서 자신있게 발언해.
자연스러운 채팅 말투로 최대 20글자이내로 짧고 간단하게 작성해.`,
  };
  return roleGuide[role];
}

export function discussPrompt(params: {
  role: PlayerRole;
  keyword: string | null;
  category: string;
  descriptions: Array<{ nickname: string; content: string }>;
  recentMessages: Array<{ nickname: string; content: string }>;
  myNickname: string;
}): string {
  const { category, descriptions, recentMessages, myNickname } = params;
  const descText = descriptions
    .map((d) => `${d.nickname}: "${d.content}"`)
    .join("\n");
  const msgText =
    recentMessages.length > 0
      ? recentMessages
          .slice(-5)
          .map((m) => `${m.nickname}: ${m.content}`)
          .join("\n")
      : "없음";

  return `카테고리: ${category}
내 닉네임: ${myNickname}

전체 설명:
${descText}

최근 대화:
${msgText}

반말로 토론 발언 1~2문장 작성해.`;
}

// ── 투표 결정 ─────────────────────────────────────────────

export function voteSystemPrompt(role: PlayerRole): string {
  const roleGuide: Record<PlayerRole, string> = {
    citizen: `너는 라이어게임의 시민이야. 가장 의심스러운 플레이어를 지목해.
설명이 너무 뜬구름 잡거나 남 말 베낀 것 같은 사람을 찾아.
투표할 플레이어 닉네임만 정확히 답해.`,
    liar: `너는 라이어게임의 라이어야. 의심을 피해야 해.
나한테 가장 의심을 많이 보낸 플레이어한테 투표하거나, 가장 만만한 사람을 골라.
투표할 플레이어 닉네임만 정확히 답해.`,
    fool: `너는 라이어게임의 바보야.
가장 의심스러운 설명을 한 플레이어를 지목해.
투표할 플레이어 닉네임만 정확히 답해.`,
  };
  return roleGuide[role];
}

export function votePrompt(params: {
  role: PlayerRole;
  keyword: string | null;
  category: string;
  descriptions: Array<{ nickname: string; content: string }>;
  otherPlayers: string[];
  myNickname: string;
}): string {
  const { category, descriptions, otherPlayers, myNickname } = params;
  const descText = descriptions
    .map((d) => `${d.nickname}: "${d.content}"`)
    .join("\n");

  return `카테고리: ${category}
내 닉네임: ${myNickname}
투표 가능한 플레이어: ${otherPlayers.join(", ")}

전체 설명:
${descText}

위 플레이어 중 한 명의 닉네임만 정확히 답하세요.`;
}

// ── 사후 분석 ─────────────────────────────────────────────

export const analyzeSystemPrompt = `당신은 라이어게임의 해설자입니다.
게임이 끝난 후 각 플레이어의 전략과 의심스러운 순간을 분석해주세요.
JSON 형식으로 분석 결과를 반환하세요.

응답 형식:
{
  "summary": "게임 전체 요약 (2~3문장)",
  "suspicion_points": [
    {"nickname": "닉네임", "description": "이 플레이어가 의심스러웠던 이유", "suspicion_level": "low|medium|high"}
  ],
  "key_clues": ["핵심 단서 1", "핵심 단서 2", "핵심 단서 3"],
  "strategy_evaluation": [
    {"nickname": "닉네임", "role": "역할", "evaluation": "전략 평가"}
  ],
  "improvement_tips": ["개선 팁 1", "개선 팁 2"]
}`;

export function analyzePrompt(params: {
  mode: string;
  category: string;
  keyword: string;
  foolKeyword: string | null;
  players: Array<{ nickname: string; role: string; is_ai: boolean }>;
  descriptions: Array<{ nickname: string; content: string }>;
  votes: Array<{ voterNickname: string; targetNickname: string }>;
  result: { winner: string; correct_guess?: boolean; guessed_keyword?: string };
}): string {
  const {
    mode,
    category,
    keyword,
    foolKeyword,
    players,
    descriptions,
    votes,
    result,
  } = params;

  const playerText = players
    .map((p) => `${p.nickname} (${p.role}${p.is_ai ? ", AI" : ""})`)
    .join(", ");
  const descText = descriptions
    .map((d) => `${d.nickname}: "${d.content}"`)
    .join("\n");
  const voteText = votes
    .map((v) => `${v.voterNickname} → ${v.targetNickname}`)
    .join(", ");

  return `게임 모드: ${mode === "classic" ? "기본 라이어" : "바보"}
카테고리: ${category}
키워드: ${keyword}${foolKeyword ? ` / 바보 키워드: ${foolKeyword}` : ""}

플레이어: ${playerText}

설명:
${descText}

투표: ${voteText}

결과: ${result.winner} 승리${result.correct_guess != null ? ` (정답 맞히기: ${result.correct_guess ? "성공" : "실패"})` : ""}${result.guessed_keyword ? ` - 제출: "${result.guessed_keyword}"` : ""}

위 게임을 분석해주세요.`;
}
