import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  sessionToken: z.string().min(1),
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
    .select("phase")
    .eq("id", roomId)
    .single();

  if (!room || room.phase !== "role_reveal") {
    return NextResponse.json({ error: "역할 확인 단계가 아닙니다." }, { status: 400 });
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .single();

  if (!player) {
    return NextResponse.json({ error: "플레이어를 찾을 수 없습니다." }, { status: 403 });
  }

  // 역할 확인 완료 표시
  await supabase
    .from("players")
    .update({ role_confirmed: true })
    .eq("id", player.id);

  // 전원 확인 완료 여부 체크
  const { data: allPlayers } = await supabase
    .from("players")
    .select("role_confirmed")
    .eq("room_id", roomId);

  const allConfirmed = (allPlayers ?? []).every((p) => p.role_confirmed);

  if (allConfirmed) {
    await supabase
      .from("rooms")
      .update({ phase: "description", phase_started_at: new Date().toISOString() })
      .eq("id", roomId);
    return NextResponse.json({ ok: true, advanced: true });
  }

  return NextResponse.json({ ok: true, advanced: false });
}
