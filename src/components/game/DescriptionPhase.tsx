"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import type { Room, Player, Description } from "@/types/game";

interface DescriptionPhaseProps {
  room: Room;
  players: Player[];
  descriptions: Description[];
  currentPlayerId: string;
  sessionToken: string;
}

export function DescriptionPhase({
  room,
  players,
  descriptions,
  currentPlayerId,
  sessionToken,
}: DescriptionPhaseProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isMyTurn = room.current_turn_player_id === currentPlayerId;
  const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id);
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const role = currentPlayer?.role;
  const keyword = role !== "liar" ? (role === "fool" ? room.fool_keyword ?? room.keyword : room.keyword) : null;

  const handleExpire = useCallback(async () => {
    if (!isMyTurn || submitted) return;
    // 타이머 만료 시 빈 내용으로 자동 제출
    await fetch(`/api/rooms/${room.id}/describe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, content: "" }),
    });
    setSubmitted(true);
  }, [isMyTurn, submitted, room.id, sessionToken]);

  const { remainingSec, progress } = useTimer({
    startedAt: room.phase_started_at,
    durationSec: room.description_timer_sec,
    onExpire: handleExpire,
  });

  const handleSubmit = async () => {
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, content: input }),
      });
      if (res.ok) {
        setSubmitted(true);
        setInput("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerColor =
    remainingSec <= 10
      ? "var(--liar-red)"
      : remainingSec <= 20
      ? "var(--citizen-gold)"
      : "var(--ai-teal)";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            설명 단계
          </p>
          <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em" }}>
            {isMyTurn ? "당신의 차례입니다" : `${currentTurnPlayer?.nickname ?? "?"}의 차례`}
          </h2>
        </div>

        {/* 타이머 */}
        {isMyTurn && (
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ fontFamily: "var(--font-game-mono, monospace)", color: timerColor }}
            >
              {remainingSec}
            </span>
            <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress * 100}%`, background: timerColor }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 내 키워드 힌트 (라이어 제외) */}
      {keyword && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.2)" }}
        >
          <span className="text-xs opacity-50" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            내 키워드
          </span>
          <span className="font-semibold" style={{ color: "var(--citizen-gold)" }}>
            {keyword}
          </span>
          <span className="text-xs opacity-30 ml-auto" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            다른 플레이어에게 키워드를 직접 말하지 마세요
          </span>
        </div>
      )}

      {/* 이전 설명 목록 */}
      {descriptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 tracking-widest uppercase" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            이전 설명
          </p>
          <div className="space-y-2">
            {descriptions.map((d) => {
              const player = players.find((p) => p.id === d.player_id);
              return (
                <div
                  key={d.id}
                  className="rounded-lg px-4 py-3 flex gap-3 items-start"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="text-xs opacity-50 shrink-0 mt-0.5"
                    style={{ fontFamily: "var(--font-game-mono, monospace)" }}
                  >
                    {d.turn_number}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium opacity-70">{player?.nickname ?? "?"}:</span>
                    <span className="ml-2 text-sm">{d.content || <span className="opacity-30 italic">（무응답）</span>}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 내 턴: 입력 영역 */}
      {isMyTurn && !submitted && (
        <div className="space-y-3">
          <textarea
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              minHeight: "80px",
              fontFamily: "inherit",
            }}
            placeholder={role === "liar" ? "키워드를 모르지만 자연스럽게 설명해보세요..." : `'${keyword}'를 설명해보세요 (키워드를 직접 말하지 마세요)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-30" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
              {input.length}/300 · Ctrl+Enter로 제출
            </span>
            <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
              {isSubmitting ? "제출 중..." : "제출"}
            </Button>
          </div>
        </div>
      )}

      {/* 내 턴: 제출 완료 */}
      {isMyTurn && submitted && (
        <div
          className="rounded-xl px-4 py-4 text-center"
          style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)" }}
        >
          <p className="text-sm" style={{ color: "var(--ai-teal)" }}>
            설명을 제출했습니다. 다음 플레이어를 기다리는 중...
          </p>
        </div>
      )}

      {/* 대기 중 */}
      {!isMyTurn && (
        <div
          className="rounded-xl px-4 py-4 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm opacity-50">
            {currentTurnPlayer?.nickname}이(가) 설명 중...
          </p>
        </div>
      )}
    </div>
  );
}
