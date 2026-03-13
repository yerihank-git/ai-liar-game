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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground animate-pulse">로딩 중...</div>
    </div>
  );
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  // Zustand persist가 hydration 전에 null일 수 있으므로 fallback 처리
  const storeSession = usePlayerStore((s) => s.session);
  const setSession = usePlayerStore((s) => s.setSession);
  const [session, setLocalSession] = useState<PlayerSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Zustand persist 방식과 localStorage 방식 병행 지원
  useEffect(() => {
    setHydrated(true);
    if (storeSession && storeSession.roomId === roomId) {
      setLocalSession(storeSession);
      return;
    }
    // fallback: 이전 방식 localStorage 직접 읽기
    const raw = localStorage.getItem("playerSession");
    if (!raw) {
      router.replace("/");
      return;
    }
    const parsed: PlayerSession = JSON.parse(raw);
    if (parsed.roomId !== roomId) {
      router.replace("/");
      return;
    }
    setLocalSession(parsed);
    setSession(parsed);
  }, [roomId, storeSession, router, setSession]);

  const room = useRoom(roomId);
  const players = usePlayers(roomId);
  const { descriptions, messages, votes } = useGameStore();

  const currentPlayer = (room ? players : []).find((p) => p.id === session?.playerId);
  const isHost = currentPlayer?.is_host ?? false;

  useAiActions({
    room,
    players,
    isHost,
  });

  if (!hydrated || !session) return <LoadingScreen />;
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
      return <LobbyPage {...commonProps} />;

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
