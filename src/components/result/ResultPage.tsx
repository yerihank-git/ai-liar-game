"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResultBanner } from "./ResultBanner";
import { RoleRevealTable } from "./RoleRevealTable";
import { VoteVisualization } from "./VoteVisualization";
import { AIAnalysis } from "./AIAnalysis";
import type { Room, Player, Vote } from "@/types/game";

interface ResultPageProps {
  room: Room;
  players: Player[];
  votes: Vote[];
  currentPlayerId: string;
  sessionToken: string;
}

export function ResultPage({ room, players, votes, currentPlayerId, sessionToken }: ResultPageProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host ?? false;

  const handleRestart = async () => {
    if (!isHost || isRestarting) return;
    setIsRestarting(true);
    try {
      await fetch(`/api/rooms/${room.id}/next-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
    } finally {
      setIsRestarting(false);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem("playerSession");
    router.replace("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <ResultBanner room={room} players={players} currentPlayerId={currentPlayerId} />
      <RoleRevealTable room={room} players={players} currentPlayerId={currentPlayerId} />
      <VoteVisualization players={players} votes={votes} />
      <AIAnalysis roomId={room.id} />

      <div className="flex gap-3 pt-2">
        {isHost && (
          <Button className="flex-1" onClick={handleRestart} disabled={isRestarting}>
            {isRestarting ? "처리 중..." : "다시하기"}
          </Button>
        )}
        <Button variant="outline" onClick={handleLeave}>
          나가기
        </Button>
      </div>

      {!isHost && (
        <p className="text-center text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
          방장이 다시하기를 누르면 같은 멤버로 재시작됩니다.
        </p>
      )}
    </div>
  );
}
