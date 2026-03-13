"use client";

import { useState, useCallback } from "react";
import { useTimer } from "@/hooks/useTimer";
import type { Room, Player, Vote } from "@/types/game";

interface VotePhaseProps {
  room: Room;
  players: Player[];
  votes: Vote[];
  currentPlayerId: string;
  sessionToken: string;
}

export function VotePhase({ room, players, votes, currentPlayerId, sessionToken }: VotePhaseProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);

  const myVote = votes.find((v) => v.voter_id === currentPlayerId);
  const hasVoted = voted || !!myVote;
  const voteCount = votes.length;
  const totalCount = players.length;

  const handleExpire = useCallback(async () => {
    if (hasVoted) return;
    // 타이머 만료 — 서버에서 미투표자 랜덤 처리
    await fetch(`/api/rooms/${room.id}/next-phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });
  }, [hasVoted, room.id, sessionToken]);

  const { remainingSec, progress } = useTimer({
    startedAt: room.phase_started_at,
    durationSec: room.vote_timer_sec,
    onExpire: handleExpire,
  });

  const handleVote = async (targetId: string) => {
    if (hasVoted || isSubmitting) return;
    setSelectedId(targetId);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, targetId }),
      });
      if (res.ok) setVoted(true);
      else setSelectedId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerColor = remainingSec <= 10 ? "var(--liar-red)" : remainingSec <= 20 ? "var(--citizen-gold)" : "var(--ai-teal)";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            투표 단계
          </p>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em" }}>
            라이어를 지목하세요
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-game-mono, monospace)", color: timerColor }}>
            {remainingSec}
          </span>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: timerColor }} />
          </div>
        </div>
      </div>

      {/* 투표 현황 */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i < voteCount ? "var(--ai-teal)" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>
        <span className="text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
          {voteCount}/{totalCount}명 투표 완료
        </span>
      </div>

      {/* 플레이어 목록 */}
      <div className="space-y-2">
        {players
          .filter((p) => p.id !== currentPlayerId)
          .map((player) => {
            const isSelected = selectedId === player.id || myVote?.target_id === player.id;
            return (
              <button
                key={player.id}
                disabled={hasVoted || isSubmitting}
                onClick={() => handleVote(player.id)}
                className="w-full rounded-xl px-4 py-3.5 flex items-center gap-3 text-left transition-all"
                style={{
                  background: isSelected ? "rgba(230,57,70,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isSelected ? "rgba(230,57,70,0.4)" : "rgba(255,255,255,0.08)"}`,
                  cursor: hasVoted ? "default" : "pointer",
                  opacity: hasVoted && !isSelected ? 0.4 : 1,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: isSelected ? "rgba(230,57,70,0.3)" : "rgba(255,255,255,0.08)",
                    color: isSelected ? "var(--liar-red)" : undefined,
                  }}
                >
                  {player.nickname[0]}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">{player.nickname}</span>
                  {player.is_ai && (
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(6,214,160,0.15)", color: "var(--ai-teal)", fontFamily: "var(--font-game-mono, monospace)" }}
                    >
                      AI
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className="text-xs" style={{ color: "var(--liar-red)", fontFamily: "var(--font-game-mono, monospace)" }}>
                    ✓ 투표함
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {hasVoted && (
        <p className="text-center text-sm opacity-50" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
          투표 완료. 다른 플레이어를 기다리는 중...
        </p>
      )}
    </div>
  );
}
