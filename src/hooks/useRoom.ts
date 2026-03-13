"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";
import type { Room } from "@/types/game";

export function useRoom(roomId: string) {
  const { room, setRoom, setDescriptions, setMessages, setVotes } = useGameStore();
  const supabase = createClient();

  useEffect(() => {
    // 초기 데이터 로드
    const load = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (data) setRoom(data as Room);

      const [{ data: desc }, { data: msgs }, { data: vts }] = await Promise.all([
        supabase.from("descriptions").select("*").eq("room_id", roomId).order("turn_number"),
        supabase.from("messages").select("*").eq("room_id", roomId).order("created_at"),
        supabase.from("votes").select("*").eq("room_id", roomId),
      ]);

      if (desc) setDescriptions(desc);
      if (msgs) setMessages(msgs);
      if (vts) setVotes(vts);
    };

    load();

    // rooms / descriptions / messages / votes 실시간 구독
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as Room)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "descriptions", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase.from("descriptions").select("*").eq("room_id", roomId).order("turn_number");
          if (data) setDescriptions(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase.from("messages").select("*").eq("room_id", roomId).order("created_at");
          if (data) setMessages(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase.from("votes").select("*").eq("room_id", roomId);
          if (data) setVotes(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return room;
}
