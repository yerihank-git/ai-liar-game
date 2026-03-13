import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  sessionToken: z.string().min(1),
  content: z.string().min(1).max(200),
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

  if (!room || room.phase !== "discussion") {
    return NextResponse.json({ error: "토론 단계가 아닙니다." }, { status: 400 });
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

  await supabase.from("messages").insert({
    room_id: roomId,
    player_id: player.id,
    content: parsed.data.content,
  });

  return NextResponse.json({ ok: true });
}
