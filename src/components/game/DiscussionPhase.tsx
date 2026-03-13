"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import type { Room, Player, Description, Message } from "@/types/game";

interface DiscussionPhaseProps {
  room: Room;
  players: Player[];
  descriptions: Description[];
  messages: Message[];
  currentPlayerId: string;
  sessionToken: string;
}

export function DiscussionPhase({
  room,
  players,
  descriptions,
  messages,
  currentPlayerId,
  sessionToken,
}: DiscussionPhaseProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { remainingSec } = useTimer({
    startedAt: room.phase_started_at,
    durationSec: room.discussion_timer_sec,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await fetch(`/api/rooms/${room.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, content: trimmed }),
      });
      setInput("");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const timerColor = remainingSec <= 30 ? "var(--liar-red)" : remainingSec <= 60 ? "var(--citizen-gold)" : "var(--ai-teal)";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            토론 단계
          </p>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em" }}>
            누가 라이어일까요?
          </h2>
        </div>
        <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-game-mono, monospace)", color: timerColor }}>
          {formatTime(remainingSec)}
        </span>
      </div>

      {/* 설명 요약 (접기/펼치기) */}
      <div className="shrink-0">
        <button
          className="text-xs opacity-50 hover:opacity-80 transition-opacity flex items-center gap-1"
          style={{ fontFamily: "var(--font-game-mono, monospace)" }}
          onClick={() => setShowDescriptions((v) => !v)}
        >
          {showDescriptions ? "▲" : "▼"} 설명 목록 {showDescriptions ? "접기" : "펼치기"}
        </button>
        {showDescriptions && (
          <div className="mt-2 space-y-1">
            {descriptions.map((d) => {
              const player = players.find((p) => p.id === d.player_id);
              return (
                <div key={d.id} className="text-sm flex gap-2">
                  <span className="opacity-50 shrink-0">{player?.nickname}:</span>
                  <span className="opacity-80">{d.content || <span className="opacity-30 italic">（무응답）</span>}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 채팅 영역 */}
      <div
        className="flex-1 rounded-xl overflow-y-auto p-3 space-y-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {messages.length === 0 && (
          <p className="text-center text-xs opacity-30 py-8" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            토론을 시작해보세요
          </p>
        )}
        {messages.map((msg) => {
          const player = players.find((p) => p.id === msg.player_id);
          const isMe = msg.player_id === currentPlayerId;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: isMe ? "rgba(230,57,70,0.3)" : "rgba(255,255,255,0.08)" }}>
                {player?.nickname?.[0] ?? "?"}
              </div>
              <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <span className="text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
                  {player?.nickname ?? "?"}{player?.is_ai ? " [AI]" : ""}
                </span>
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: isMe ? "rgba(230,57,70,0.15)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isMe ? "rgba(230,57,70,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "inherit",
          }}
          placeholder="의견을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend();
          }}
          maxLength={200}
        />
        <Button onClick={handleSend} disabled={isSending || !input.trim()} size="sm">
          전송
        </Button>
      </div>
    </div>
  );
}
