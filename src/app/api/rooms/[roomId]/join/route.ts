import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GAME_CONFIG } from "@/constants/game-config";

// POST /api/rooms/[roomId]/join — 방 입장
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await req.json().catch(() => null);
  const { nickname, sessionToken } = body ?? {};

  if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
    return NextResponse.json({ error: "닉네임은 2자 이상이어야 합니다." }, { status: 400 });
  }
  if (!sessionToken || typeof sessionToken !== "string") {
    return NextResponse.json({ error: "세션 토큰이 필요합니다." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 방 조회
  const { data: room } = await supabase
    .from("rooms")
    .select("id, phase, max_players")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: "존재하지 않는 방입니다." }, { status: 404 });
  }
  if (room.phase !== "waiting") {
    return NextResponse.json({ error: "이미 게임이 진행 중인 방입니다." }, { status: 409 });
  }

  // 현재 인원 확인
  const { count } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  if ((count ?? 0) >= GAME_CONFIG.MAX_PLAYERS) {
    return NextResponse.json({ error: "방이 가득 찼습니다." }, { status: 409 });
  }

  // 세션 토큰으로 기존 플레이어 확인 (재접속)
  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_token", sessionToken)
    .single();

  if (existing) {
    await supabase
      .from("players")
      .update({ is_connected: true, nickname: nickname.trim() })
      .eq("id", existing.id);
    return NextResponse.json({ playerId: existing.id });
  }

  // 새 플레이어 생성
  const { data: player, error } = await supabase
    .from("players")
    .insert({
      room_id: roomId,
      nickname: nickname.trim(),
      is_host: false,
      session_token: sessionToken,
    })
    .select("id")
    .single();

  if (error || !player) {
    return NextResponse.json({ error: "방 입장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ playerId: player.id }, { status: 201 });
}
