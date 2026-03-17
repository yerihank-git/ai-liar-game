"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSessionToken } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";
import type { JoinRoomResponse } from "@/types/game";

interface JoinRoomDialogProps {
  children: React.ReactNode;
  initialRoomCode?: string;
  defaultOpen?: boolean;
}

export function JoinRoomDialog({ children, initialRoomCode = "", defaultOpen = false }: JoinRoomDialogProps) {
  const router = useRouter();
  const setSession = usePlayerStore((s) => s.setSession);
  const [open, setOpen] = useState(false);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const nicknameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    const trimmedNick = nickname.trim();

    if (code.length !== 6) {
      setError("방 코드는 6자리입니다.");
      return;
    }
    if (trimmedNick.length < 2 || trimmedNick.length > 12) {
      setError("닉네임은 2~12자로 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 방 코드로 roomId 조회
      const searchRes = await fetch(`/api/rooms?code=${code}`);
      if (!searchRes.ok) {
        setError("존재하지 않는 방 코드입니다.");
        return;
      }
      const { roomId } = await searchRes.json();

      const sessionToken = generateSessionToken();

      const joinRes = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmedNick, sessionToken }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        setError(data.error ?? "방 입장에 실패했습니다.");
        return;
      }

      const data: JoinRoomResponse = await joinRes.json();

      setSession({
        playerId: data.playerId,
        sessionToken,
        nickname: trimmedNick,
        roomId,
      });

      setOpen(false);
      router.push(`/room/${roomId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ display: "contents" }}>
        {children}
      </span>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v && initialRoomCode) {
            setTimeout(() => nicknameRef.current?.focus(), 50);
          }
        }}
      >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>방 입장</DialogTitle>
          <DialogDescription>
            방 코드와 닉네임을 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            placeholder="방 코드 (6자리)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="tracking-widest font-mono text-center text-lg"
            autoFocus={!initialRoomCode}
          />
          <Input
            ref={nicknameRef}
            placeholder="닉네임 (2~12자)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={12}
            autoFocus={!!initialRoomCode}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleJoin} disabled={loading} className="w-full">
            {loading ? "입장 중..." : "입장하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
