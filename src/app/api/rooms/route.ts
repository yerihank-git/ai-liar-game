import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils";
import { GAME_CONFIG } from "@/constants/game-config";

// POST /api/rooms — 방 생성
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { nickname, sessionToken } = body ?? {};

  if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
    return NextResponse.json({ error: "닉네임은 2자 이상이어야 합니다." }, { status: 400 });
  }
  if (!sessionToken || typeof sessionToken !== "string") {
    return NextResponse.json({ error: "세션 토큰이 필요합니다." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 유니크한 방 코드 생성 (최대 5회 재시도)
  let roomCode = "";
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    const { data } = await supabase.from("rooms").select("id").eq("room_code", code).single();
    if (!data) {
      roomCode = code;
      break;
    }
  }
  if (!roomCode) {
    return NextResponse.json({ error: "방 코드 생성에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }

  // rooms 생성 (host_player_id는 플레이어 생성 후 업데이트)
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      room_code: roomCode,
      description_timer_sec: GAME_CONFIG.DEFAULT_DESCRIPTION_TIMER,
      discussion_timer_sec: GAME_CONFIG.DEFAULT_DISCUSSION_TIMER,
      vote_timer_sec: GAME_CONFIG.DEFAULT_VOTE_TIMER,
      final_defense_timer_sec: GAME_CONFIG.DEFAULT_FINAL_DEFENSE_TIMER,
    })
    .select("id")
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "방 생성에 실패했습니다." }, { status: 500 });
  }

  // 방장 플레이어 생성
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      nickname: nickname.trim(),
      is_host: true,
      session_token: sessionToken,
    })
    .select("id")
    .single();

  if (playerError || !player) {
    // 롤백
    await supabase.from("rooms").delete().eq("id", room.id);
    return NextResponse.json({ error: "플레이어 생성에 실패했습니다." }, { status: 500 });
  }

  // rooms.host_player_id 업데이트
  await supabase.from("rooms").update({ host_player_id: player.id }).eq("id", room.id);

  return NextResponse.json({ roomId: room.id, playerId: player.id }, { status: 201 });
}

// GET /api/rooms?code=XXXXXX — 방 코드로 roomId 조회
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "방 코드가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, phase")
    .eq("room_code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "존재하지 않는 방 코드입니다." }, { status: 404 });
  }

  return NextResponse.json({ roomId: room.id });
}
