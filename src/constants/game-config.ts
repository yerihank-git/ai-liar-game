export const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 8,
  MAX_AI_PLAYERS: 2,
  ROOM_CODE_LENGTH: 6,
  SESSION_TOKEN_BYTES: 32, // hex 64자

  // 타이머 옵션 (초)
  DESCRIPTION_TIMER_OPTIONS: [30, 60, 90] as const,
  DISCUSSION_TIMER_OPTIONS: [60, 90, 120] as const,
  VOTE_TIMER_OPTIONS: [15, 30] as const,
  FINAL_DEFENSE_TIMER_OPTIONS: [15, 30] as const,

  // 타이머 기본값 (초)
  DEFAULT_DESCRIPTION_TIMER: 30, // 설명 시간 기본값
  DEFAULT_DISCUSSION_TIMER: 90, // 토론 시간 기본값
  DEFAULT_VOTE_TIMER: 15, // 투표 시간 기본값
  DEFAULT_FINAL_DEFENSE_TIMER: 15, // 최후 변론 시간 기본값

  // AI 플레이어 닉네임
  AI_NICKNAMES: ["BYEUB", "MEDIAI"] as const,

  // 방 만료 시간 (24시간 이후 삭제 권장)
  ROOM_EXPIRE_HOURS: 24,
} as const;
