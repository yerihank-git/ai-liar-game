"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";
import type { Player } from "@/types/game";

export function usePlayers(roomId: string) {
  const { players, setPlayers } = useGameStore();
  const supabase = createClient();

  useEffect(() => {
    // 초기 데이터 로드
    const load = async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at");
      if (data) setPlayers(data as Player[]);
    };

    load();

    // players 실시간 구독 — 변경 시 전체 재조회
    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase
            .from("players")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at");
          if (data) setPlayers(data as Player[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return players;
}
