import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GAME_CONFIG } from "@/constants/game-config";
import type { GameMode } from "@/types/game";

// PATCH /api/rooms/[roomId]/settings — 게임 설정 업데이트 (방장 전용)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await req.json().catch(() => null);
  const { sessionToken, mode, category, description_timer_sec, discussion_timer_sec, vote_timer_sec } = body ?? {};

  if (!sessionToken) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const supabase = createServerClient();

  // 방장 검증
  const { data: player } = await supabase
    .from("players")
    .select("id, is_host")
    .eq("room_id", roomId)
    .eq("session_token", sessionToken)
    .single();

  if (!player?.is_host) {
    return NextResponse.json({ error: "방장만 설정을 변경할 수 있습니다." }, { status: 403 });
  }

  // 대기실에서만 변경 가능
  const { data: room } = await supabase
    .from("rooms")
    .select("phase")
    .eq("id", roomId)
    .single();

  if (room?.phase !== "waiting") {
    return NextResponse.json({ error: "게임 중에는 설정을 변경할 수 없습니다." }, { status: 409 });
  }

  // 유효성 검사
  const updates: Record<string, unknown> = {};

  if (mode !== undefined) {
    const validModes: GameMode[] = ["classic", "fool"];
    if (!validModes.includes(mode)) return NextResponse.json({ error: "올바르지 않은 모드입니다." }, { status: 400 });
    updates.mode = mode;
  }
  if (category !== undefined) updates.category = category;
  if (description_timer_sec !== undefined) {
    if (!GAME_CONFIG.DESCRIPTION_TIMER_OPTIONS.includes(description_timer_sec)) {
      return NextResponse.json({ error: "올바르지 않은 설명 타이머 값입니다." }, { status: 400 });
    }
    updates.description_timer_sec = description_timer_sec;
  }
  if (discussion_timer_sec !== undefined) {
    if (!GAME_CONFIG.DISCUSSION_TIMER_OPTIONS.includes(discussion_timer_sec)) {
      return NextResponse.json({ error: "올바르지 않은 토론 타이머 값입니다." }, { status: 400 });
    }
    updates.discussion_timer_sec = discussion_timer_sec;
  }
  if (vote_timer_sec !== undefined) {
    if (!GAME_CONFIG.VOTE_TIMER_OPTIONS.includes(vote_timer_sec)) {
      return NextResponse.json({ error: "올바르지 않은 투표 타이머 값입니다." }, { status: 400 });
    }
    updates.vote_timer_sec = vote_timer_sec;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  const { error } = await supabase.from("rooms").update(updates).eq("id", roomId);
  if (error) return NextResponse.json({ error: "설정 저장에 실패했습니다." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
