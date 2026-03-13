import type { Player, PlayerRole, GameMode, GameResult, Vote } from "@/types/game";

/**
 * 플레이어 중 랜덤 1명에게 특수 역할(라이어/바보) 배정, 나머지는 시민
 */
export function assignRoles(
  players: Player[],
  mode: GameMode
): Map<string, PlayerRole> {
  const roleMap = new Map<string, PlayerRole>();
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const specialRole: PlayerRole = mode === "classic" ? "liar" : "fool";
  roleMap.set(shuffled[0].id, specialRole);

  for (let i = 1; i < shuffled.length; i++) {
    roleMap.set(shuffled[i].id, "citizen");
  }

  return roleMap;
}

/**
 * 턴 순서 랜덤 결정 (플레이어 id 배열)
 */
export function determineTurnOrder(players: Player[]): string[] {
  return [...players].sort(() => Math.random() - 0.5).map((p) => p.id);
}

/**
 * 투표 집계 — 최다 득표 플레이어 id 반환
 * 동점이면 null 반환 (재투표 필요)
 */
export function countVotes(votes: Vote[]): {
  topPlayerId: string | null;
  isTie: boolean;
  tally: Record<string, number>;
} {
  const tally: Record<string, number> = {};
  for (const vote of votes) {
    tally[vote.target_id] = (tally[vote.target_id] ?? 0) + 1;
  }

  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return { topPlayerId: null, isTie: false, tally };

  const maxCount = entries[0][1];
  const topEntries = entries.filter(([, count]) => count === maxCount);
  const isTie = topEntries.length > 1;

  return {
    topPlayerId: isTie ? null : topEntries[0][0],
    isTie,
    tally,
  };
}

/**
 * 승패 판정 (기본 라이어 모드)
 * - 라이어 미지목 → 라이어 승
 * - 라이어 지목 + 정답 성공 → 라이어 승
 * - 라이어 지목 + 정답 실패 → 시민 승
 */
export function judgeClassic(params: {
  accusedPlayerId: string | null;
  liarPlayerId: string;
  guessedKeyword: string | null;
  actualKeyword: string;
}): GameResult {
  const { accusedPlayerId, liarPlayerId, guessedKeyword, actualKeyword } = params;

  // 라이어 미지목
  if (accusedPlayerId !== liarPlayerId) {
    return {
      winner: "liar",
      liar_player_id: liarPlayerId,
      correct_guess: false,
    };
  }

  // 라이어 지목 → 정답 여부 판정
  const correctGuess =
    guessedKeyword != null &&
    guessedKeyword.trim().toLowerCase() === actualKeyword.trim().toLowerCase();

  if (correctGuess) {
    return {
      winner: "liar",
      liar_player_id: liarPlayerId,
      guessed_keyword: guessedKeyword ?? undefined,
      correct_guess: true,
    };
  }

  return {
    winner: "citizens",
    liar_player_id: liarPlayerId,
    guessed_keyword: guessedKeyword ?? undefined,
    correct_guess: false,
  };
}

/**
 * 승패 판정 (바보 모드)
 * - 바보 지목 → 시민 승
 * - 바보 미지목 → 바보 승
 */
export function judgeFool(params: {
  accusedPlayerId: string | null;
  foolPlayerId: string;
}): GameResult {
  const { accusedPlayerId, foolPlayerId } = params;

  if (accusedPlayerId === foolPlayerId) {
    return {
      winner: "citizens",
      fool_player_id: foolPlayerId,
    };
  }

  return {
    winner: "fool",
    fool_player_id: foolPlayerId,
  };
}

/**
 * 카테고리 키워드 목록에서 랜덤 1개 선택
 */
export function pickRandomKeyword(keywords: string[]): string {
  return keywords[Math.floor(Math.random() * keywords.length)];
}

/**
 * 현재 턴 이후 다음 플레이어 id 반환.
 * turnOrder의 마지막 플레이어면 null 반환 (설명 단계 종료)
 */
export function getNextTurnPlayerId(
  turnOrder: string[],
  currentPlayerId: string
): string | null {
  const idx = turnOrder.indexOf(currentPlayerId);
  if (idx === -1 || idx >= turnOrder.length - 1) return null;
  return turnOrder[idx + 1];
}
