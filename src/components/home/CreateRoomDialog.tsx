"use client";

import { useState } from "react";
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
import type { CreateRoomResponse } from "@/types/game";

interface CreateRoomDialogProps {
  children: React.ReactNode;
}

export function CreateRoomDialog({ children }: CreateRoomDialogProps) {
  const router = useRouter();
  const setSession = usePlayerStore((s) => s.setSession);
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      setError("닉네임은 2~12자로 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const sessionToken = generateSessionToken();

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed, sessionToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "방 생성에 실패했습니다.");
        return;
      }

      const data: CreateRoomResponse = await res.json();

      // 세션 Zustand 스토어에 저장 (persist가 localStorage에 자동 기록)
      setSession({
        playerId: data.playerId,
        sessionToken,
        nickname: trimmed,
        roomId: data.roomId,
      });

      setOpen(false);
      router.push(`/room/${data.roomId}`);
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
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>방 만들기</DialogTitle>
          <DialogDescription>
            닉네임을 입력하면 바로 방이 생성됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            placeholder="닉네임 (2~12자)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            maxLength={12}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "생성 중..." : "방 만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
