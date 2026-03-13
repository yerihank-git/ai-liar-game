"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceState {
  playerId: string;
  nickname: string;
}

export function usePresence(roomId: string, playerId: string, nickname: string) {
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!playerId) return;

    const channel = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: playerId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const ids = Object.values(state)
          .flat()
          .map((p) => p.playerId)
          .filter(Boolean);
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ playerId, nickname });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId, nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOnline = (id: string) => onlineIds.includes(id);

  return { onlineIds, isOnline };
}
