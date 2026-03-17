"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";
import type { Player } from "@/types/game";

export function usePlayers(roomId: string) {
  const { players, setPlayers } = useGameStore();
  const supabase = createClient();

  const refetch = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at");
    if (data) setPlayers(data as Player[]);
  };

  useEffect(() => {
    refetch();

    // players 실시간 구독 — 변경 시 전체 재조회
    // DELETE 이벤트는 REPLICA IDENTITY DEFAULT 환경에서 column filter가 동작하지 않아
    // INSERT/UPDATE만 filter 적용, DELETE는 filter 없이 별도 구독
    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "players" },
        refetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { players, refetch };
}
