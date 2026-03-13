"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GamePhase, Room, Player, PlayerSession } from "@/types/game";

// 각 phase별 컴포넌트 (Sprint 2~3에서 구현)
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground animate-pulse">로딩 중...</div>
    </div>
  );
}

function PhasePlaceholder({ phase }: { phase: GamePhase }) {
  const labels: Record<GamePhase, string> = {
    waiting: "대기실",
    role_reveal: "역할 확인",
    description: "설명 단계",
    discussion: "토론",
    vote: "투표",
    final_defense: "최후의 변론",
    result: "결과",
  };
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-lg text-muted-foreground">
        [{labels[phase] ?? phase}] — 개발 중
      </p>
    </div>
  );
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [notFound, setNotFound] = useState(false);

  // localStorage에서 세션 복원
  useEffect(() => {
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
    setSession(parsed);
  }, [roomId, router]);

  // 방 데이터 초기 로드 + Realtime 구독
  useEffect(() => {
    if (!session) return;
    const supabase = createClient();

    const load = async () => {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!roomData) {
        setNotFound(true);
        return;
      }
      setRoom(roomData as Room);

      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at");

      setPlayers((playerData as Player[]) ?? []);
    };

    load();

    // rooms 실시간 구독
    const roomSub = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as Room)
      )
      .subscribe();

    // players 실시간 구독
    const playerSub = supabase
      .channel(`players:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase
            .from("players")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at");
          setPlayers((data as Player[]) ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(playerSub);
    };
  }, [roomId, session]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">존재하지 않는 방입니다.</p>
        <button onClick={() => router.replace("/")} className="text-primary underline text-sm">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!room || !session) return <LoadingScreen />;

  return <PhasePlaceholder phase={room.phase} />;
}
