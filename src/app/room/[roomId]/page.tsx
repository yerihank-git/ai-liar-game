"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useGameStore } from "@/store/game-store";
import { useRoom } from "@/hooks/useRoom";
import { usePlayers } from "@/hooks/usePlayers";
import { LobbyPage } from "@/components/lobby/LobbyPage";
import { RoleReveal } from "@/components/game/RoleReveal";
import { DescriptionPhase } from "@/components/game/DescriptionPhase";
import { DiscussionPhase } from "@/components/game/DiscussionPhase";
import { VotePhase } from "@/components/game/VotePhase";
import { FinalDefense } from "@/components/game/FinalDefense";
import { ResultPage } from "@/components/result/ResultPage";
import { useAiActions } from "@/hooks/useAiActions";
import type { PlayerSession } from "@/types/game";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div
        className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: "var(--ai-teal)", borderRightColor: "rgba(6,214,160,0.3)" }}
      />
      <p className="text-sm opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
        로딩 중...
      </p>
    </div>
  );
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const storeSession = usePlayerStore((s) => s.session);
  const [session, setLocalSession] = useState<PlayerSession | null>(null);
  // Zustand persist hydration 완료 여부
  const [zustandReady, setZustandReady] = useState(
    () => usePlayerStore.persist?.hasHydrated() ?? false
  );

  useEffect(() => {
    if (zustandReady) return;
    return usePlayerStore.persist?.onFinishHydration(() => setZustandReady(true));
  }, [zustandReady]);

  useEffect(() => {
    if (!zustandReady) return; // hydration 전에는 판단하지 않음

    if (storeSession && storeSession.roomId === roomId) {
      setLocalSession(storeSession);
      return;
    }
    // 세션 없거나 다른 방 → 메인으로
    router.replace("/");
  }, [zustandReady, roomId, storeSession, router]);

  const room = useRoom(roomId);
  const { players, refetch: refetchPlayers } = usePlayers(roomId);
  const { descriptions, messages, votes } = useGameStore();

  const currentPlayer = (room ? players : []).find((p) => p.id === session?.playerId);
  const isHost = currentPlayer?.is_host ?? false;

  useAiActions({
    room,
    players,
    isHost,
  });

  if (!zustandReady || !session) return <LoadingScreen />;
  if (!room) return <LoadingScreen />;

  const commonProps = {
    room,
    players,
    currentPlayerId: session.playerId,
    sessionToken: session.sessionToken,
  };

  // phase별 컴포넌트 분기
  switch (room.phase) {
    case "waiting":
      return <LobbyPage {...commonProps} onPlayersRefetch={refetchPlayers} />;

    case "role_reveal":
      return (
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <RoleReveal {...commonProps} />
        </div>
      );

    case "description":
      return (
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <DescriptionPhase {...commonProps} descriptions={descriptions} />
        </div>
      );

    case "discussion":
      return (
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <DiscussionPhase {...commonProps} descriptions={descriptions} messages={messages} isHost={isHost} />
        </div>
      );

    case "vote":
      return (
        <div className="max-w-xl mx-auto px-4 py-4 sm:py-6">
          <VotePhase {...commonProps} votes={votes} />
        </div>
      );

    case "final_defense":
      return (
        <div className="max-w-xl mx-auto px-4 py-4 sm:py-6">
          <FinalDefense {...commonProps} />
        </div>
      );

    case "result":
      return (
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <ResultPage {...commonProps} votes={votes} />
        </div>
      );
  }
}
