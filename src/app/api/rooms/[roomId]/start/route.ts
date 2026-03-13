import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { assignRoles, determineTurnOrder, pickRandomKeyword } from "@/lib/game-logic";
import { CATEGORIES } from "@/constants/categories";
import type { Player } from "@/types/game";

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

  // 방 조회
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }

  if (room.phase !== "waiting") {
    return NextResponse.json({ error: "이미 게임이 시작되었습니다." }, { status: 400 });
  }

  // 방장 검증
  const { data: hostPlayer } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .eq("is_host", true)
    .single();

  if (!hostPlayer) {
    return NextResponse.json({ error: "방장만 게임을 시작할 수 있습니다." }, { status: 403 });
  }

  // 플레이어 목록 조회
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId);

  if (!players || players.length < 3) {
    return NextResponse.json({ error: "최소 3명이 필요합니다." }, { status: 400 });
  }

  // 역할 배정
  const roleMap = assignRoles(players as Player[], room.mode);
  const turnOrder = determineTurnOrder(players as Player[]);

  // 키워드 선택
  const category = room.category ?? CATEGORIES[0].name;
  const categoryData = CATEGORIES.find((c) => c.name === category) ?? CATEGORIES[0];
  const keyword = pickRandomKeyword(categoryData.keywords);

  // 플레이어 역할 업데이트
  const roleUpdates = players.map((p) =>
    supabase
      .from("players")
      .update({ role: roleMap.get(p.id), role_confirmed: false })
      .eq("id", p.id)
  );
  await Promise.all(roleUpdates);

  // 방 상태 업데이트
  const { error: updateErr } = await supabase
    .from("rooms")
    .update({
      phase: "role_reveal",
      keyword,
      fool_keyword: null,
      turn_order: turnOrder,
      current_turn_player_id: turnOrder[0],
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  if (updateErr) {
    return NextResponse.json({ error: "게임 시작에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
