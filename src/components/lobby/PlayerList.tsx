"use client";

import { Crown, Bot, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/game";

interface PlayerListProps {
  players: Player[];
  isOnline: (id: string) => boolean;
  currentPlayerId: string;
}

export function PlayerList({ players, isOnline, currentPlayerId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => {
        const online = player.is_ai || isOnline(player.id);
        const isMe = player.id === currentPlayerId;

        return (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
              isMe && "border-primary/40 bg-primary/5"
            )}
          >
            {/* 온라인 상태 점 */}
            <span
              className={cn(
                "h-2 w-2 flex-shrink-0 rounded-full",
                online ? "bg-green-500" : "bg-muted-foreground/40"
              )}
            />

            {/* 닉네임 */}
            <span className="flex-1 font-medium text-sm">
              {player.nickname}
              {isMe && (
                <span className="ml-1.5 text-xs text-muted-foreground">(나)</span>
              )}
            </span>

            {/* 뱃지들 */}
            <div className="flex items-center gap-1.5">
              {player.is_host && (
                <Crown className="h-4 w-4 text-yellow-500" aria-label="방장" />
              )}
              {player.is_ai && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                  <Bot className="h-3 w-3" />
                  AI
                </Badge>
              )}
              {!online && !player.is_ai && (
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground/60" aria-label="오프라인" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
