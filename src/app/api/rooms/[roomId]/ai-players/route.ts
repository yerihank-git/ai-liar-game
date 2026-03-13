import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GAME_CONFIG } from "@/constants/game-config";
import { generateSessionToken } from "@/lib/utils";

// POST /api/rooms/[roomId]/ai-players — AI 플레이어 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { sessionToken } = await req.json().catch(() => ({}));

  if (!sessionToken) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const supabase = createServerClient();

  // 방장 검증
  const { data: requester } = await supabase
    .from("players")
    .select("is_host")
    .eq("room_id", roomId)
    .eq("session_token", sessionToken)
    .single();

  if (!requester?.is_host) {
    return NextResponse.json({ error: "방장만 AI를 추가할 수 있습니다." }, { status: 403 });
  }

  // 현재 AI 수 + 전체 인원 확인
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, is_ai, nickname")
    .eq("room_id", roomId);

  const aiPlayers = (allPlayers ?? []).filter((p) => p.is_ai);

  if (aiPlayers.length >= GAME_CONFIG.MAX_AI_PLAYERS) {
    return NextResponse.json({ error: `AI 플레이어는 최대 ${GAME_CONFIG.MAX_AI_PLAYERS}명입니다.` }, { status: 409 });
  }
  if ((allPlayers ?? []).length >= GAME_CONFIG.MAX_PLAYERS) {
    return NextResponse.json({ error: "방이 가득 찼습니다." }, { status: 409 });
  }

  // 사용할 AI 닉네임 결정 (ARIA → NOVA 순서)
  const usedNames = aiPlayers.map((p) => p.nickname);
  const nickname = GAME_CONFIG.AI_NICKNAMES.find((n) => !usedNames.includes(n));
  if (!nickname) return NextResponse.json({ error: "AI 닉네임을 배정할 수 없습니다." }, { status: 500 });

  const { data: aiPlayer, error } = await supabase
    .from("players")
    .insert({
      room_id: roomId,
      nickname,
      is_ai: true,
      is_host: false,
      session_token: generateSessionToken(),
    })
    .select("id")
    .single();

  if (error || !aiPlayer) {
    return NextResponse.json({ error: "AI 플레이어 추가에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ playerId: aiPlayer.id, nickname }, { status: 201 });
}

// DELETE /api/rooms/[roomId]/ai-players — AI 플레이어 제거 (마지막 추가 순서)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { sessionToken } = await req.json().catch(() => ({}));

  if (!sessionToken) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const supabase = createServerClient();

  // 방장 검증
  const { data: requester } = await supabase
    .from("players")
    .select("is_host")
    .eq("room_id", roomId)
    .eq("session_token", sessionToken)
    .single();

  if (!requester?.is_host) {
    return NextResponse.json({ error: "방장만 AI를 제거할 수 있습니다." }, { status: 403 });
  }

  // 가장 나중에 추가된 AI 플레이어 제거
  const { data: aiPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("is_ai", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!aiPlayers?.length) {
    return NextResponse.json({ error: "제거할 AI 플레이어가 없습니다." }, { status: 404 });
  }

  await supabase.from("players").delete().eq("id", aiPlayers[0].id);

  return NextResponse.json({ ok: true });
}
