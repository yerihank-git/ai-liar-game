"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Room, Player } from "@/types/game";

interface RoleRevealProps {
  room: Room;
  players: Player[];
  currentPlayerId: string;
  sessionToken: string;
}

const ROLE_CONFIG = {
  citizen: {
    label: "시민",
    color: "var(--citizen-gold)",
    bg: "rgba(244,162,97,0.08)",
    border: "rgba(244,162,97,0.3)",
    description: "키워드를 알고 있습니다. 라이어를 찾으세요!",
  },
  liar: {
    label: "라이어",
    color: "var(--liar-red)",
    bg: "rgba(230,57,70,0.08)",
    border: "rgba(230,57,70,0.3)",
    description: "키워드를 모릅니다. 들키지 마세요!",
  },
  fool: {
    label: "시민",
    color: "var(--citizen-gold)",
    bg: "rgba(244,162,97,0.08)",
    border: "rgba(244,162,97,0.3)",
    description: "키워드를 알고 있습니다. 다같이 설명해봐요!",
  },
} as const;

export function RoleReveal({ room, players, currentPlayerId, sessionToken }: RoleRevealProps) {
  const [flipped, setFlipped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const role = currentPlayer?.role ?? "citizen";
  const config = ROLE_CONFIG[role];

  const confirmedCount = players.filter((p) => p.role_confirmed).length;
  const totalCount = players.length;

  const handleConfirm = async () => {
    if (confirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/rooms/${room.id}/confirm-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      setConfirmed(true);
      // phase 전환은 Realtime으로 자동 반영
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="text-center space-y-2">
        <p
          className="text-xs tracking-[0.3em] uppercase opacity-50"
          style={{ fontFamily: "var(--font-game-mono, monospace)" }}
        >
          역할 확인
        </p>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em" }}
        >
          당신의 역할을 확인하세요
        </h2>
      </div>

      {/* 역할 카드 */}
      <div
        className="relative w-56 h-72 sm:w-64 sm:h-80 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 카드 앞면 */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{
              backfaceVisibility: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-4xl">🃏</div>
            <p
              className="text-xs tracking-widest uppercase opacity-50"
              style={{ fontFamily: "var(--font-game-mono, monospace)" }}
            >
              탭하여 확인
            </p>
          </div>

          {/* 카드 뒷면 (역할 공개) */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-4 p-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: config.bg,
              border: `1px solid ${config.border}`,
            }}
          >
            <p
              className="text-xs tracking-[0.3em] uppercase opacity-60"
              style={{ fontFamily: "var(--font-game-mono, monospace)" }}
            >
              당신은
            </p>
            <p
              className="text-5xl font-bold"
              style={{
                fontFamily: "var(--font-bebas, sans-serif)",
                color: config.color,
                letterSpacing: "0.1em",
              }}
            >
              {config.label}
            </p>

            {role !== "liar" && room.keyword && (
              <div
                className="text-center px-4 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs opacity-50 mb-1" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
                  키워드
                </p>
                <p className="text-lg font-semibold" style={{ color: config.color }}>
                  {role === "fool" ? room.fool_keyword ?? room.keyword : room.keyword}
                </p>
              </div>
            )}

            {role === "liar" && (
              <div className="text-center px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-sm opacity-60" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
                  키워드 없음
                </p>
              </div>
            )}

            <p className="text-xs text-center opacity-50 leading-relaxed" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {/* 확인 완료 버튼 */}
      {flipped && (
        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={handleConfirm}
            disabled={confirmed || isSubmitting}
            className="px-8"
          >
            {confirmed ? "확인 완료 ✓" : isSubmitting ? "처리 중..." : "확인 완료"}
          </Button>
          <p className="text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            확인 완료: {confirmedCount}/{totalCount}명 · 전원 확인 시 자동 시작
          </p>
        </div>
      )}
    </div>
  );
}
