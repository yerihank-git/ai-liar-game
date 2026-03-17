"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./PlayerList";
import { InviteLink } from "./InviteLink";
import { GameSettings } from "./GameSettings";
import { usePresence } from "@/hooks/usePresence";
import { useGameStore } from "@/store/game-store";
import { GAME_CONFIG } from "@/constants/game-config";
import type { Room, Player, GameMode } from "@/types/game";
import { CATEGORIES } from "@/constants/categories";

const getCategoryName = (id: string | null | undefined) =>
  CATEGORIES.find((c) => c.id === id)?.name ?? id ?? "미정";

interface LobbyPageProps {
  room: Room;
  players: Player[];
  currentPlayerId: string;
  sessionToken: string;
  onPlayersRefetch?: () => void;
}

export function LobbyPage({
  room,
  players,
  currentPlayerId,
  sessionToken,
  onPlayersRefetch,
}: LobbyPageProps) {
  const router = useRouter();
  const { setRoom } = useGameStore();
  const [isStarting, setIsStarting] = useState(false);
  // AI 플레이어 수 optimistic 상태 (null이면 실제 값 사용)
  const [optimisticAiCount, setOptimisticAiCount] = useState<number | null>(
    null,
  );
  const isAiPendingRef = useRef(false);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host ?? false;
  const aiPlayers = players.filter((p) => p.is_ai);
  const aiPlayerCount = optimisticAiCount ?? aiPlayers.length;

  // Realtime으로 실제 DB값이 optimistic 목표에 도달하면 optimistic 해제
  useEffect(() => {
    if (optimisticAiCount !== null && aiPlayers.length === optimisticAiCount) {
      setOptimisticAiCount(null);
      isAiPendingRef.current = false;
    }
  }, [aiPlayers.length, optimisticAiCount]);

  const canStart = players.length >= GAME_CONFIG.MIN_PLAYERS;

  const { isOnline } = usePresence(
    room.id,
    currentPlayerId,
    currentPlayer?.nickname ?? "",
  );

  // Optimistic update: 즉시 로컬 상태 반영 후 API 호출, 실패 시 롤백
  const patch = async (body: Record<string, unknown>) => {
    const prev = room;
    setRoom({ ...room, ...body } as Room); // 즉시 반영
    try {
      await fetch(`/api/rooms/${room.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, ...body }),
      });
    } catch {
      setRoom(prev); // 실패 시 롤백
    }
  };

  const handleModeChange = (mode: GameMode) => patch({ mode });
  const handleCategoryChange = (category: string) => patch({ category });
  const handleTimerChange = (field: string, value: number) =>
    patch({ [field]: value });

  const handleAiCountChange = async (targetCount: number) => {
    if (isAiPendingRef.current) return; // 요청 중 중복 클릭 방지
    const current = aiPlayerCount; // optimistic 값 기준으로 판단
    if (targetCount === current) return;

    isAiPendingRef.current = true;
    setOptimisticAiCount(targetCount); // 즉시 UI 반영
    try {
      if (targetCount > current) {
        await fetch(`/api/rooms/${room.id}/ai-players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        });
      } else {
        await fetch(`/api/rooms/${room.id}/ai-players`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        });
        // DELETE 이벤트는 Realtime 필터가 동작하지 않으므로 수동 재조회
        onPlayersRefetch?.();
      }
    } catch {
      // 실패 시 롤백
      setOptimisticAiCount(null);
      isAiPendingRef.current = false;
    }
    // finally 없음: Realtime으로 DB값이 목표에 도달하면 useEffect에서 해제
  };

  const handleStart = async () => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "게임 시작에 실패했습니다.");
      }
      // phase 변경은 Realtime으로 자동 반영
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem("playerSession");
    router.replace("/");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 max-w-4xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
      {/* 왼쪽: 플레이어 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            참가자{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {players.length}/{GAME_CONFIG.MAX_PLAYERS}명
            </span>
          </h2>
          {!canStart && (
            <span className="text-xs text-muted-foreground">
              최소 {GAME_CONFIG.MIN_PLAYERS}명 필요
            </span>
          )}
        </div>

        <PlayerList
          players={players}
          isOnline={isOnline}
          currentPlayerId={currentPlayerId}
        />

        <InviteLink roomCode={room.room_code} />

        {/* 버튼 영역 */}
        <div className="flex gap-2 pt-2">
          {isHost && (
            <Button
              className="flex-1 gap-2"
              disabled={!canStart || isStarting}
              onClick={handleStart}
            >
              <Play className="h-4 w-4" />
              {isStarting ? "시작 중..." : "게임 시작"}
            </Button>
          )}
          <Button variant="outline" onClick={handleLeave} className="gap-2">
            <LogOut className="h-4 w-4" />
            나가기
          </Button>
        </div>
      </div>

      {/* 오른쪽: 게임 설정 (방장만) */}
      {isHost ? (
        <div className="rounded-xl border p-5 space-y-1">
          <h3 className="font-semibold text-sm mb-4">게임 설정</h3>
          <GameSettings
            room={room}
            aiPlayerCount={aiPlayerCount}
            onModeChange={handleModeChange}
            onCategoryChange={handleCategoryChange}
            onAiCountChange={handleAiCountChange}
            onTimerChange={handleTimerChange}
            isUpdating={false}
            isAiPending={optimisticAiCount !== null}
          />
        </div>
      ) : (
        <div className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold text-sm">게임 정보</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              모드:{" "}
              <span className="text-foreground font-medium">
                {room.mode === "classic" ? "기본 라이어" : "바보 모드"}
              </span>
            </p>
            <p>
              카테고리:{" "}
              <span className="text-foreground font-medium">
                {getCategoryName(room.category)}
              </span>
            </p>
            <p>
              AI 참가:{" "}
              <span className="text-foreground font-medium">
                {aiPlayers.length}명 (
                {aiPlayers.map((p) => p.nickname).join(", ") || "없음"})
              </span>
            </p>
            <p className="pt-2 text-xs">
              방장이 게임을 시작하면 자동으로 진행됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
