import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude, randomDelay } from "@/lib/ai/claude";
import { voteSystemPrompt, votePrompt } from "@/lib/ai/prompts";
import type { PlayerRole } from "@/types/game";

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
  if (!room || room.phase !== "vote") {
    return NextResponse.json({ error: "투표 단계가 아닙니다." }, { status: 400 });
  }

  const { data: aiPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("id", aiPlayerId)
    .eq("is_ai", true)
    .single();

  if (!aiPlayer) return NextResponse.json({ error: "AI 플레이어 없음" }, { status: 400 });

  // 이미 투표했는지 확인
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("room_id", roomId)
    .eq("voter_id", aiPlayerId)
    .single();

  if (existingVote) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const [{ data: descriptions }, { data: players }] = await Promise.all([
    supabase.from("descriptions").select("player_id, content").eq("room_id", roomId).order("turn_number"),
    supabase.from("players").select("id, nickname").eq("room_id", roomId),
  ]);

  const nicknameMap = new Map((players ?? []).map((p) => [p.id, p.nickname]));
  const otherPlayers = (players ?? []).filter((p) => p.id !== aiPlayerId);
  const otherNicknames = otherPlayers.map((p) => p.nickname);

  const descList = (descriptions ?? []).map((d) => ({
    nickname: nicknameMap.get(d.player_id) ?? "?",
    content: d.content,
  }));

  const role = aiPlayer.role as PlayerRole;
  const keyword = role === "citizen" ? room.keyword : role === "fool" ? room.fool_keyword ?? room.keyword : null;

  // 딜레이 (2~5초)
  await randomDelay(2000, 5000);

  const aiText = await callClaude({
    system: voteSystemPrompt(role),
    prompt: votePrompt({
      role,
      keyword,
      category: room.category ?? "",
      descriptions: descList,
      otherPlayers: otherNicknames,
      myNickname: aiPlayer.nickname,
    }),
    maxTokens: 50,
  });

  // AI 응답에서 닉네임 추출
  let targetId: string | null = null;
  if (aiText) {
    const trimmed = aiText.trim();
    const matched = otherPlayers.find((p) => p.nickname === trimmed || trimmed.includes(p.nickname));
    if (matched) targetId = matched.id;
  }

  // 닉네임 매칭 실패 시 랜덤
  if (!targetId && otherPlayers.length > 0) {
    targetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
  }

  if (!targetId) {
    return NextResponse.json({ error: "투표 대상 없음" }, { status: 400 });
  }

  // 투표 저장 (완료 여부 체크 및 phase 전환은 vote/route.ts 또는 next-phase에서 처리)
  await supabase.from("votes").upsert(
    { room_id: roomId, voter_id: aiPlayerId, target_id: targetId },
    { onConflict: "room_id,voter_id" }
  );

  return NextResponse.json({ ok: true, targetId });
}
