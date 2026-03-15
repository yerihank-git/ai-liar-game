import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude, randomDelay } from "@/lib/ai/claude";
import { describeSystemPrompt, describePrompt } from "@/lib/ai/prompts";
import { getNextTurnPlayerId } from "@/lib/game-logic";
import type { PlayerRole } from "@/types/game";

const FALLBACK_DESCRIPTIONS: Record<PlayerRole, string[]> = {
  citizen: [
    "꽤 인상적인 것이죠. 많은 사람들이 좋아합니다.",
    "우리 일상과 밀접한 연관이 있어요.",
    "처음 접하면 독특한 느낌을 받을 수 있어요.",
  ],
  liar: [
    "흠, 뭔가 특별한 게 있는 것 같은데... 딱 설명하기 어렵네요.",
    "여러 가지 면에서 독특하다고 할 수 있죠.",
    "다들 설명을 잘 하시는군요. 저도 비슷하게 생각해요.",
  ],
  fool: [
    "제가 아는 것과 비슷한 것 같아요.",
    "독특한 특징이 있죠.",
    "여러모로 인상 깊은 것입니다.",
  ],
};

const bodySchema = z.object({
  roomId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { roomId } = parsed.data;

  // 방 조회
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room || room.phase !== "description") {
    return NextResponse.json({ error: "설명 단계가 아닙니다." }, { status: 400 });
  }

  // 현재 턴 AI 플레이어 확인
  const { data: aiPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("id", room.current_turn_player_id)
    .eq("is_ai", true)
    .single();

  if (!aiPlayer) {
    return NextResponse.json({ error: "현재 턴 AI 플레이어 없음" }, { status: 400 });
  }

  // 이전 설명 목록 조회
  const { data: descriptions } = await supabase
    .from("descriptions")
    .select("player_id, content")
    .eq("room_id", roomId)
    .order("turn_number");

  // 플레이어 닉네임 매핑
  const { data: players } = await supabase.from("players").select("id, nickname").eq("room_id", roomId);
  const nicknameMap = new Map((players ?? []).map((p) => [p.id, p.nickname]));

  const prevDescs = (descriptions ?? []).map((d) => ({
    nickname: nicknameMap.get(d.player_id) ?? "?",
    content: d.content,
  }));

  const role = aiPlayer.role as PlayerRole;
  const keyword =
    role === "fool"
      ? room.fool_keyword ?? room.keyword
      : role === "citizen"
      ? room.keyword
      : null;

  // 의도적 딜레이 (2~4초)
  await randomDelay(2000, 4000);

  // AI 설명 생성
  const aiText = await callClaude({
    system: describeSystemPrompt(role),
    prompt: describePrompt({
      role,
      keyword,
      category: room.category ?? "",
      previousDescriptions: prevDescs,
    }),
  });

  const fallbacks = FALLBACK_DESCRIPTIONS[role];
  const content = aiText ?? fallbacks[Math.floor(Math.random() * fallbacks.length)];

  // 설명 저장 + 다음 턴 전환
  const turnNumber = (descriptions?.length ?? 0) + 1;
  const { error: descError } = await supabase.from("descriptions").insert({
    room_id: roomId,
    player_id: aiPlayer.id,
    content,
    turn_number: turnNumber,
  });

  if (descError) {
    console.error("[ai/describe] descriptions insert error:", descError.message);
    return NextResponse.json({ error: "설명 저장 실패" }, { status: 500 });
  }

  const nextPlayerId = getNextTurnPlayerId(room.turn_order, aiPlayer.id);
  const { error: roomError } = nextPlayerId
    ? await supabase
        .from("rooms")
        .update({ current_turn_player_id: nextPlayerId, phase_started_at: new Date().toISOString() })
        .eq("id", roomId)
        .eq("phase", "description")
    : await supabase
        .from("rooms")
        .update({ phase: "discussion", current_turn_player_id: null, phase_started_at: new Date().toISOString() })
        .eq("id", roomId)
        .eq("phase", "description");

  if (roomError) {
    console.error("[ai/describe] rooms update error:", roomError.message);
    return NextResponse.json({ error: "게임 상태 업데이트 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, content });
}
