import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude, randomDelay } from "@/lib/ai/claude";
import { discussSystemPrompt, discussPrompt } from "@/lib/ai/prompts";
import type { PlayerRole } from "@/types/game";

const FALLBACK_MESSAGES = [
  "저도 좀 더 생각해봐야 할 것 같아요.",
  "다들 의견이 있으시군요.",
  "음... 조금 의심스러운 부분이 있네요.",
  "저는 확신이 서지 않아요.",
];

const bodySchema = z.object({
  roomId: z.string().uuid(),
  aiPlayerId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { roomId, aiPlayerId } = parsed.data;

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room || room.phase !== "discussion") {
    return NextResponse.json({ error: "토론 단계가 아닙니다." }, { status: 400 });
  }

  const { data: aiPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("id", aiPlayerId)
    .eq("is_ai", true)
    .single();

  if (!aiPlayer) {
    return NextResponse.json({ error: "AI 플레이어 없음" }, { status: 400 });
  }

  // 데이터 조회
  const [{ data: descriptions }, { data: messages }, { data: players }] = await Promise.all([
    supabase.from("descriptions").select("player_id, content").eq("room_id", roomId).order("turn_number"),
    supabase.from("messages").select("player_id, content").eq("room_id", roomId).order("created_at"),
    supabase.from("players").select("id, nickname").eq("room_id", roomId),
  ]);

  const nicknameMap = new Map((players ?? []).map((p) => [p.id, p.nickname]));

  const descList = (descriptions ?? []).map((d) => ({
    nickname: nicknameMap.get(d.player_id) ?? "?",
    content: d.content,
  }));
  const msgList = (messages ?? []).slice(-10).map((m) => ({
    nickname: nicknameMap.get(m.player_id) ?? "?",
    content: m.content,
  }));

  const role = aiPlayer.role as PlayerRole;
  const keyword = role === "fool" ? room.fool_keyword ?? room.keyword : role === "citizen" ? room.keyword : null;

  // 랜덤 딜레이
  await randomDelay(1500, 3500);

  const aiText = await callClaude({
    system: discussSystemPrompt(role),
    prompt: discussPrompt({
      role,
      keyword,
      category: room.category ?? "",
      descriptions: descList,
      recentMessages: msgList,
      myNickname: aiPlayer.nickname,
    }),
  });

  const content = aiText ?? FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];

  await supabase.from("messages").insert({
    room_id: roomId,
    player_id: aiPlayerId,
    content,
  });

  return NextResponse.json({ ok: true, content });
}
