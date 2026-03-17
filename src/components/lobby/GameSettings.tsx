"use client";

import { useState } from "react";
import { Bot, BotOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/constants/categories";
import { GAME_CONFIG } from "@/constants/game-config";
import type { GameMode, Room } from "@/types/game";

interface GameSettingsProps {
  room: Room;
  aiPlayerCount: number;
  onModeChange: (mode: GameMode) => void;
  onCategoryChange: (category: string) => void;
  onAiCountChange: (count: number) => void;
  onTimerChange: (field: string, value: number) => void;
  isUpdating: boolean;
  isAiPending?: boolean;
}

export function GameSettings({
  room,
  aiPlayerCount,
  onModeChange,
  onCategoryChange,
  onAiCountChange,
  onTimerChange,
  isUpdating,
  isAiPending = false,
}: GameSettingsProps) {
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  return (
    <div className="space-y-4">
      {/* 모드 선택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">게임 모드</p>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={room.mode === "classic"}
            onClick={() => onModeChange("classic")}
            disabled={isUpdating}
          >
            <span className="font-medium">기본 라이어</span>
            <span className="text-xs text-muted-foreground mt-0.5">라이어가 제시어를 모름</span>
          </ModeButton>
          <ModeButton
            active={room.mode === "fool"}
            onClick={() => onModeChange("fool")}
            disabled={isUpdating}
          >
            <span className="font-medium">바보 모드</span>
            <span className="text-xs text-muted-foreground mt-0.5">바보가 다른 키워드를 받음</span>
          </ModeButton>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">카테고리</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              disabled={isUpdating}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                room.category === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50 hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* AI 플레이어 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">AI 플레이어</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAiCountChange(Math.max(0, aiPlayerCount - 1))}
            disabled={isUpdating || isAiPending || aiPlayerCount === 0}
            className="h-8 px-2 gap-1"
          >
            <BotOff className="h-4 w-4" />
            <span className="text-xs">제외</span>
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: GAME_CONFIG.MAX_AI_PLAYERS }).map((_, i) => (
              <Badge
                key={i}
                variant={i < aiPlayerCount ? "default" : "outline"}
                className="gap-1 text-xs"
              >
                <Bot className="h-3 w-3" />
                {GAME_CONFIG.AI_NICKNAMES[i]}
              </Badge>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAiCountChange(Math.min(GAME_CONFIG.MAX_AI_PLAYERS, aiPlayerCount + 1))}
            disabled={isUpdating || isAiPending || aiPlayerCount >= GAME_CONFIG.MAX_AI_PLAYERS}
            className="h-8 px-2 gap-1"
          >
            <Bot className="h-4 w-4" />
            <span className="text-xs">추가</span>
          </Button>
        </div>
      </div>

      {/* 타이머 설정 (접기/펼치기) */}
      <div className="space-y-2">
        <button
          onClick={() => setShowTimerSettings((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          타이머 설정
          <span className="text-xs">{showTimerSettings ? "▲" : "▼"}</span>
        </button>

        {showTimerSettings && (
          <div className="space-y-3 rounded-lg border p-3">
            <TimerRow
              label="설명 제한"
              options={GAME_CONFIG.DESCRIPTION_TIMER_OPTIONS}
              value={room.description_timer_sec}
              onChange={(v) => onTimerChange("description_timer_sec", v)}
              unit="초"
              disabled={isUpdating}
            />
            <TimerRow
              label="토론 제한"
              options={GAME_CONFIG.DISCUSSION_TIMER_OPTIONS}
              value={room.discussion_timer_sec}
              onChange={(v) => onTimerChange("discussion_timer_sec", v)}
              unit="초"
              disabled={isUpdating}
            />
            <TimerRow
              label="투표 제한"
              options={GAME_CONFIG.VOTE_TIMER_OPTIONS}
              value={room.vote_timer_sec}
              onChange={(v) => onTimerChange("vote_timer_sec", v)}
              unit="초"
              disabled={isUpdating}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center rounded-lg border p-3 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:border-primary/40 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function TimerRow({
  label,
  options,
  value,
  onChange,
  unit,
  disabled,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (v: number) => void;
  unit: string;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            disabled={disabled}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              value === opt
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted-foreground/20"
            }`}
          >
            {opt}
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}
