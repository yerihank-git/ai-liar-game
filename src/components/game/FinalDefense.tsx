"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import type { Room, Player } from "@/types/game";

interface FinalDefenseProps {
  room: Room;
  players: Player[];
  currentPlayerId: string;
  sessionToken: string;
}

export function FinalDefense({ room, players, currentPlayerId, sessionToken }: FinalDefenseProps) {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const accusedPlayer = players.find((p) => p.id === room.current_turn_player_id);
  const isLiar = accusedPlayer?.id === currentPlayerId;

  const handleExpire = useCallback(async () => {
    if (!isLiar || submitted) return;
    // 시간 초과 — 서버에서 라이어 정답 실패 처리
    await fetch(`/api/rooms/${room.id}/next-phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });
  }, [isLiar, submitted, room.id, sessionToken]);

  const { remainingSec } = useTimer({
    startedAt: room.phase_started_at,
    durationSec: room.final_defense_timer_sec,
    onExpire: handleExpire,
  });

  const handleSubmit = async () => {
    if (!guess.trim() || isSubmitting || submitted) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, keyword: guess.trim() }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerColor = remainingSec <= 10 ? "var(--liar-red)" : "var(--citizen-gold)";

  return (
    <div className="max-w-xl mx-auto space-y-6 flex flex-col items-center text-center">
      <div>
        <p className="text-xs tracking-[0.3em] uppercase opacity-40 mb-1" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
          최후의 변론
        </p>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em", color: "var(--liar-red)" }}>
          {accusedPlayer?.nickname}이(가) 라이어로 지목되었습니다
        </h2>
      </div>

      <div className="text-4xl font-bold tabular-nums" style={{ fontFamily: "var(--font-game-mono, monospace)", color: timerColor }}>
        {remainingSec}
      </div>

      {isLiar ? (
        <div className="w-full space-y-4">
          <p className="text-sm opacity-70">
            키워드를 맞히면 역전 승리! 카테고리: <strong>{room.category}</strong>
          </p>

          {!submitted ? (
            <>
              <input
                type="text"
                className="w-full rounded-xl px-4 py-3 text-center text-lg outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontFamily: "inherit",
                }}
                placeholder="키워드를 입력하세요"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                autoFocus
              />
              <Button onClick={handleSubmit} disabled={!guess.trim() || isSubmitting} className="w-full">
                {isSubmitting ? "제출 중..." : "정답 제출"}
              </Button>
            </>
          ) : (
            <div className="rounded-xl px-4 py-4" style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)" }}>
              <p style={{ color: "var(--ai-teal)" }}>정답을 제출했습니다. 결과를 기다리는 중...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm opacity-60">
            라이어가 키워드를 맞히는 중입니다...
          </p>
          <div
            className="rounded-xl px-4 py-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
              카테고리: {room.category}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
