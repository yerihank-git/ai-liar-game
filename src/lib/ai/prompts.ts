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
    citizen: `당신은 라이어게임의 시민입니다. 키워드를 알고 있습니다.
키워드를 직접 말하지 않으면서 설명해야 합니다.
너무 명확하게 설명하면 라이어가 따라 하기 쉬우니 약간의 간접 표현을 섞으세요.
자연스럽고 간결하게, 한 두 문장으로 답하세요.`,
    liar: `당신은 라이어게임의 라이어입니다. 키워드를 모릅니다.
다른 플레이어들의 설명을 참고해 추론하되, 확신 있는 척 설명하세요.
너무 구체적인 표현은 피하고 모호하게 설명하세요.
자연스럽고 간결하게, 한 두 문장으로 답하세요.`,
    fool: `당신은 라이어게임의 바보입니다. 당신이 받은 키워드로 설명하세요.
자신의 키워드가 맞다고 믿고 자연스럽게 설명하세요.
자연스럽고 간결하게, 한 두 문장으로 답하세요.`,
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
      ? previousDescriptions.map((d) => `${d.nickname}: "${d.content}"`).join("\n")
      : "없음";

  return `카테고리: ${category}
${role !== "liar" && keyword ? `당신의 키워드: ${keyword}` : "키워드: 모름 (라이어)"}

이전 플레이어들의 설명:
${prev}

이제 당신의 설명을 한 두 문장으로 작성하세요. 키워드를 직접 언급하지 마세요.`;
}

// ── 토론 메시지 생성 ──────────────────────────────────────

export function discussSystemPrompt(role: PlayerRole): string {
  const roleGuide: Record<PlayerRole, string> = {
    citizen: `당신은 라이어게임의 시민입니다. 토론에서 라이어를 찾아야 합니다.
다른 플레이어의 설명에서 의심스러운 점을 지적하거나, 자신의 의견을 자연스럽게 표현하세요.
짧고 자연스러운 한국어 채팅 메시지 1~2문장으로 답하세요.`,
    liar: `당신은 라이어게임의 라이어입니다. 의심을 피해야 합니다.
자신에게 쏠리는 의심을 다른 사람에게 돌리거나, 무고함을 자연스럽게 주장하세요.
짧고 자연스러운 한국어 채팅 메시지 1~2문장으로 답하세요.`,
    fool: `당신은 라이어게임의 바보입니다. 자신이 시민이라고 믿습니다.
자신있게 시민으로서 발언하세요.
짧고 자연스러운 한국어 채팅 메시지 1~2문장으로 답하세요.`,
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
  const descText = descriptions.map((d) => `${d.nickname}: "${d.content}"`).join("\n");
  const msgText =
    recentMessages.length > 0
      ? recentMessages.slice(-5).map((m) => `${m.nickname}: ${m.content}`).join("\n")
      : "없음";

  return `카테고리: ${category}
내 닉네임: ${myNickname}

전체 설명:
${descText}

최근 대화:
${msgText}

토론 발언을 1~2문장으로 작성하세요.`;
}

// ── 투표 결정 ─────────────────────────────────────────────

export function voteSystemPrompt(role: PlayerRole): string {
  const roleGuide: Record<PlayerRole, string> = {
    citizen: `당신은 라이어게임의 시민입니다. 가장 의심스러운 플레이어를 지목해야 합니다.
설명이 너무 모호하거나 다른 사람의 설명을 베낀 것 같은 플레이어를 찾으세요.
투표할 플레이어의 닉네임만 정확히 답하세요.`,
    liar: `당신은 라이어게임의 라이어입니다. 의심을 피해야 합니다.
자신에게 가장 의심을 많이 보내는 플레이어에게 투표하거나,
또는 가장 의심스럽게 행동하는 척하기 쉬운 플레이어를 지목하세요.
투표할 플레이어의 닉네임만 정확히 답하세요.`,
    fool: `당신은 라이어게임의 바보입니다.
가장 의심스러운 설명을 한 플레이어를 지목하세요.
투표할 플레이어의 닉네임만 정확히 답하세요.`,
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
  const descText = descriptions.map((d) => `${d.nickname}: "${d.content}"`).join("\n");

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
  const { mode, category, keyword, foolKeyword, players, descriptions, votes, result } = params;

  const playerText = players.map((p) => `${p.nickname} (${p.role}${p.is_ai ? ", AI" : ""})`).join(", ");
  const descText = descriptions.map((d) => `${d.nickname}: "${d.content}"`).join("\n");
  const voteText = votes.map((v) => `${v.voterNickname} → ${v.targetNickname}`).join(", ");

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
