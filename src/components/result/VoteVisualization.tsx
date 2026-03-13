"use client";

import type { Player, Vote } from "@/types/game";

interface VoteVisualizationProps {
  players: Player[];
  votes: Vote[];
}

export function VoteVisualization({ players, votes }: VoteVisualizationProps) {
  // 득표 수 집계
  const tally: Record<string, number> = {};
  for (const vote of votes) {
    tally[vote.target_id] = (tally[vote.target_id] ?? 0) + 1;
  }

  const maxVotes = Math.max(...Object.values(tally), 1);
  const sortedPlayers = [...players].sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0));

  if (votes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-semibold tracking-widest uppercase opacity-60"
        style={{ fontFamily: "var(--font-game-mono, monospace)" }}
      >
        투표 결과
      </h3>

      <div className="space-y-2">
        {sortedPlayers.map((player) => {
          const count = tally[player.id] ?? 0;
          const pct = count / maxVotes;
          const isTop = count > 0 && count === maxVotes;
          const color = isTop ? "var(--liar-red)" : "rgba(255,255,255,0.2)";

          // 이 플레이어에게 투표한 사람 목록
          const voterIds = votes.filter((v) => v.target_id === player.id).map((v) => v.voter_id);
          const voterNames = voterIds
            .map((id) => players.find((p) => p.id === id)?.nickname ?? "?")
            .join(", ");

          return (
            <div key={player.id} className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-20 truncate font-medium">{player.nickname}</span>
                <div
                  className="flex-1 h-5 rounded overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{ width: `${pct * 100}%`, background: color }}
                  />
                </div>
                <span
                  className="w-4 text-right text-sm font-bold tabular-nums"
                  style={{ color: isTop ? "var(--liar-red)" : "rgba(255,255,255,0.4)", fontFamily: "var(--font-game-mono, monospace)" }}
                >
                  {count}
                </span>
              </div>
              {voterNames && (
                <p className="text-xs opacity-30 pl-22" style={{ paddingLeft: "5.5rem", fontFamily: "var(--font-game-mono, monospace)" }}>
                  ← {voterNames}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
