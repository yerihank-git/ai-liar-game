import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { judgeClassic } from "@/lib/game-logic";

const bodySchema = z.object({
  sessionToken: z.string().min(1),
  keyword: z.string().min(1).max(50),
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

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room || room.phase !== "final_defense") {
    return NextResponse.json({ error: "최후의 변론 단계가 아닙니다." }, { status: 400 });
  }

  // 제출자가 라이어인지 확인
  const { data: player } = await supabase
    .from("players")
    .select("id, role")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .single();

  if (!player || player.role !== "liar") {
    return NextResponse.json({ error: "라이어만 정답을 제출할 수 있습니다." }, { status: 403 });
  }

  // 투표에서 지목된 플레이어 (current_turn_player_id = 라이어)
  const result = judgeClassic({
    accusedPlayerId: room.current_turn_player_id,
    liarPlayerId: player.id,
    guessedKeyword: parsed.data.keyword,
    actualKeyword: room.keyword ?? "",
  });

  await supabase
    .from("rooms")
    .update({
      phase: "result",
      result,
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  return NextResponse.json({ ok: true, result });
}
