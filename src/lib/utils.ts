import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GAME_CONFIG } from "@/constants/game-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 6자리 영숫자 방 코드 생성 (대문자) */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 문자 제외
  return Array.from(
    { length: GAME_CONFIG.ROOM_CODE_LENGTH },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/** 64자 hex 세션 토큰 생성 */
export function generateSessionToken(): string {
  const array = new Uint8Array(GAME_CONFIG.SESSION_TOKEN_BYTES);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Node.js 환경 (API Route)
    const { randomFillSync } = require("crypto"); // eslint-disable-line @typescript-eslint/no-require-imports
    randomFillSync(array);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** ms를 "MM:SS" 형식으로 변환 */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
