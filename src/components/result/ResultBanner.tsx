"use client";

import type { Room, Player } from "@/types/game";

interface ResultBannerProps {
  room: Room;
  players: Player[];
  currentPlayerId: string;
}

export function ResultBanner({ room, players, currentPlayerId }: ResultBannerProps) {
  const result = room.result;
  if (!result) return null;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const currentRole = currentPlayer?.role;

  // 내가 이겼는지 계산
  let iWon = false;
  if (result.winner === "citizens" && currentRole === "citizen") iWon = true;
  if (result.winner === "liar" && currentRole === "liar") iWon = true;
  if (result.winner === "fool" && currentRole === "fool") iWon = true;

  const config = {
    citizens: {
      label: "시민 승리",
      color: "var(--citizen-gold)",
      bg: "rgba(244,162,97,0.08)",
      border: "rgba(244,162,97,0.25)",
      emoji: "🏆",
      sub: "라이어를 성공적으로 찾아냈습니다!",
    },
    liar: {
      label: "라이어 승리",
      color: "var(--liar-red)",
      bg: "rgba(230,57,70,0.08)",
      border: "rgba(230,57,70,0.25)",
      emoji: "🃏",
      sub: result.correct_guess
        ? `키워드 '${result.guessed_keyword}'를 맞혀 역전 승리!`
        : "라이어를 잡지 못했습니다...",
    },
    fool: {
      label: "바보 승리",
      color: "var(--ai-teal)",
      bg: "rgba(6,214,160,0.08)",
      border: "rgba(6,214,160,0.25)",
      emoji: "🎭",
      sub: "바보가 정체를 숨기는 데 성공했습니다!",
    },
  }[result.winner];

  return (
    <div
      className="rounded-2xl p-6 text-center space-y-3"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <div className="text-5xl">{config.emoji}</div>
      <h2
        className="text-4xl font-bold"
        style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em", color: config.color }}
      >
        {config.label}
      </h2>
      <p className="text-sm opacity-70">{config.sub}</p>
      {!currentPlayer?.is_ai && (
        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mt-2"
          style={{
            background: iWon ? "rgba(6,214,160,0.15)" : "rgba(255,255,255,0.06)",
            color: iWon ? "var(--ai-teal)" : "rgba(255,255,255,0.5)",
          }}
        >
          {iWon ? "🎉 승리!" : "😔 패배"}
        </div>
      )}
    </div>
  );
}
