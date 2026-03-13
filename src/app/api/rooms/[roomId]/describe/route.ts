import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getNextTurnPlayerId } from "@/lib/game-logic";

const bodySchema = z.object({
  sessionToken: z.string().min(1),
  content: z.string().max(300).default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 방 조회
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room || room.phase !== "description") {
    return NextResponse.json({ error: "설명 단계가 아닙니다." }, { status: 400 });
  }

  // 제출자 확인
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .single();

  if (!player) {
    return NextResponse.json({ error: "플레이어를 찾을 수 없습니다." }, { status: 403 });
  }

  if (room.current_turn_player_id !== player.id) {
    return NextResponse.json({ error: "현재 당신의 턴이 아닙니다." }, { status: 400 });
  }

  // 기존 설명 수 조회 (turn_number용)
  const { count } = await supabase
    .from("descriptions")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  const turnNumber = (count ?? 0) + 1;

  // 설명 저장
  await supabase.from("descriptions").insert({
    room_id: roomId,
    player_id: player.id,
    content: parsed.data.content.trim(),
    turn_number: turnNumber,
  });

  // 다음 턴 계산
  const nextPlayerId = getNextTurnPlayerId(room.turn_order, player.id);

  if (nextPlayerId) {
    // 다음 플레이어 턴으로 전환
    await supabase
      .from("rooms")
      .update({
        current_turn_player_id: nextPlayerId,
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", roomId);
  } else {
    // 모든 설명 완료 → 토론 단계로 전환
    await supabase
      .from("rooms")
      .update({
        phase: "discussion",
        current_turn_player_id: null,
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", roomId);
  }

  return NextResponse.json({ ok: true });
}
