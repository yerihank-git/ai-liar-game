"use client";

import { useEffect, useRef } from "react";
import type { Room, Player } from "@/types/game";

interface UseAiActionsParams {
  room: Room | null;
  players: Player[];
  sessionToken: string;
  /** 방장만 AI 액션을 트리거 (중복 호출 방지) */
  isHost: boolean;
}

/**
 * 게임 진행 중 AI 플레이어의 행동을 자동으로 트리거하는 훅.
 * 방장 클라이언트에서만 AI API를 호출하여 중복 방지.
 */
export function useAiActions({ room, players, sessionToken, isHost }: UseAiActionsParams) {
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!room || !isHost) return;

    const key = `${room.id}-${room.phase}-${room.current_turn_player_id ?? "none"}-${room.phase_started_at ?? ""}`;
    if (triggeredRef.current.has(key)) return;

    const aiPlayers = players.filter((p) => p.is_ai);
    if (aiPlayers.length === 0) return;

    // 설명 단계: 현재 턴이 AI 플레이어면 자동 describe
    if (room.phase === "description" && room.current_turn_player_id) {
      const currentAi = aiPlayers.find((p) => p.id === room.current_turn_player_id);
      if (currentAi) {
        triggeredRef.current.add(key);
        fetch(`/api/ai/describe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.id }),
        }).catch(() => {});
      }
    }

    // 토론 단계: 30초 간격으로 AI 메시지 (각 AI 최대 2회)
    if (room.phase === "discussion") {
      triggeredRef.current.add(key);
      const elapsed = room.phase_started_at
        ? (Date.now() - new Date(room.phase_started_at).getTime()) / 1000
        : 0;

      aiPlayers.forEach((ai, idx) => {
        // 각 AI가 토론 시간의 1/3, 2/3 지점에 메시지
        const delay1 = Math.max(0, room.discussion_timer_sec / 3 - elapsed) * 1000 + idx * 2000;
        const delay2 = Math.max(0, (room.discussion_timer_sec * 2) / 3 - elapsed) * 1000 + idx * 2000;

        setTimeout(() => {
          if (room.phase === "discussion") {
            fetch(`/api/ai/discuss`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId: room.id, aiPlayerId: ai.id }),
            }).catch(() => {});
          }
        }, delay1);

        setTimeout(() => {
          if (room.phase === "discussion") {
            fetch(`/api/ai/discuss`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId: room.id, aiPlayerId: ai.id }),
            }).catch(() => {});
          }
        }, delay2);
      });
    }

    // 투표 단계: AI 자동 투표
    if (room.phase === "vote") {
      triggeredRef.current.add(key);
      aiPlayers.forEach((ai, idx) => {
        setTimeout(() => {
          fetch(`/api/ai/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: room.id, aiPlayerId: ai.id }),
          }).catch(() => {});
        }, (idx + 1) * 1500);
      });
    }
  }, [room?.phase, room?.current_turn_player_id, room?.phase_started_at]); // eslint-disable-line react-hooks/exhaustive-deps
}
