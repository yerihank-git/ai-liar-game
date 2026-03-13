"use client";

import type { Room, Player } from "@/types/game";

interface RoleRevealTableProps {
  room: Room;
  players: Player[];
  currentPlayerId: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  citizen: { label: "시민", color: "var(--citizen-gold)" },
  liar: { label: "라이어", color: "var(--liar-red)" },
  fool: { label: "바보", color: "var(--ai-teal)" },
};

export function RoleRevealTable({ room, players, currentPlayerId }: RoleRevealTableProps) {
  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-semibold tracking-widest uppercase opacity-60"
        style={{ fontFamily: "var(--font-game-mono, monospace)" }}
      >
        역할 공개
      </h3>

      {/* 키워드 정보 */}
      <div
        className="rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div>
          <span className="opacity-40 mr-2" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>카테고리</span>
          <span className="font-medium">{room.category ?? "?"}</span>
        </div>
        <div>
          <span className="opacity-40 mr-2" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>키워드</span>
          <span className="font-semibold" style={{ color: "var(--citizen-gold)" }}>{room.keyword ?? "?"}</span>
        </div>
        {room.mode === "fool" && room.fool_keyword && (
          <div>
            <span className="opacity-40 mr-2" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>바보 키워드</span>
            <span className="font-semibold" style={{ color: "var(--ai-teal)" }}>{room.fool_keyword}</span>
          </div>
        )}
      </div>

      {/* 플레이어 역할 목록 */}
      <div className="space-y-1.5">
        {players.map((player) => {
          const roleInfo = player.role ? ROLE_LABELS[player.role] : null;
          const isMe = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className="rounded-lg px-4 py-2.5 flex items-center gap-3"
              style={{
                background: isMe ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isMe ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {player.nickname[0]}
              </div>
              <span className="flex-1 text-sm font-medium">
                {player.nickname}
                {isMe && <span className="ml-1.5 text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>(나)</span>}
                {player.is_ai && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(6,214,160,0.15)", color: "var(--ai-teal)", fontFamily: "var(--font-game-mono, monospace)" }}>
                    AI
                  </span>
                )}
              </span>
              {roleInfo && (
                <span
                  className="text-sm font-semibold"
                  style={{ color: roleInfo.color, fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.05em" }}
                >
                  {roleInfo.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
