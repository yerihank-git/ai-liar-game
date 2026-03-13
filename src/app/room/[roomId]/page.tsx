"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";
import { useRoom } from "@/hooks/useRoom";
import { usePlayers } from "@/hooks/usePlayers";
import { LobbyPage } from "@/components/lobby/LobbyPage";
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

  if (!hydrated || !session) return <LoadingScreen />;
  if (!room) return <LoadingScreen />;

  // phase별 컴포넌트 분기
  switch (room.phase) {
    case "waiting":
      return (
        <LobbyPage
          room={room}
          players={players}
          currentPlayerId={session.playerId}
          sessionToken={session.sessionToken}
        />
      );

    case "role_reveal":
    case "description":
    case "discussion":
    case "vote":
    case "final_defense":
    case "result":
      // Sprint 3에서 구현
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">
            [{room.phase}] 단계 — Sprint 3에서 구현 예정
          </p>
        </div>
      );
  }
}
