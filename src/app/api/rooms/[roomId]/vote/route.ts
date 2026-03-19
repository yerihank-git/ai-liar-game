import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { countVotes, judgeClassic, judgeFool } from "@/lib/game-logic";
import type { Vote } from "@/types/game";

const bodySchema = z.object({
  sessionToken: z.string().min(1),
  targetId: z.string().uuid(),
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

  if (!room || room.phase !== "vote") {
    return NextResponse.json({ error: "투표 단계가 아닙니다." }, { status: 400 });
  }

  // 투표자 확인
  const { data: voter } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .single();

  if (!voter) {
    return NextResponse.json({ error: "플레이어를 찾을 수 없습니다." }, { status: 403 });
  }

  if (voter.id === parsed.data.targetId) {
    return NextResponse.json({ error: "자신에게 투표할 수 없습니다." }, { status: 400 });
  }

  // UPSERT — 같은 voter_id는 하나만 유지
  const { error: voteErr } = await supabase.from("votes").upsert(
    {
      room_id: roomId,
      voter_id: voter.id,
      target_id: parsed.data.targetId,
    },
    { onConflict: "room_id,voter_id" }
  );

  if (voteErr) {
    return NextResponse.json({ error: "투표 저장에 실패했습니다." }, { status: 500 });
  }

  // 전원 투표 완료 여부 확인
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId);

  const { data: allVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("room_id", roomId);

  const playerCount = allPlayers?.length ?? 0;
  const voteCount = allVotes?.length ?? 0;

  if (voteCount >= playerCount) {
    // 투표 집계
    const { topPlayerId, isTie } = countVotes(allVotes as Vote[]);

    if (isTie) {
      // 동점 → 재투표 (낙관적 잠금: 같은 라운드에서 1회만 실행)
      const { data: updated } = await supabase
        .from("rooms")
        .update({ phase_started_at: new Date().toISOString() })
        .eq("id", roomId)
        .eq("phase", "vote")
        .eq("phase_started_at", room.phase_started_at)
        .select("id");

      if (updated && updated.length > 0) {
        await supabase.from("votes").delete().eq("room_id", roomId);
      }
      return NextResponse.json({ ok: true, tie: true });
    }

    // 최다 득표자 역할 확인 후 다음 phase 및 result 결정
    const { data: accusedPlayer } = await supabase
      .from("players")
      .select("role")
      .eq("id", topPlayerId!)
      .single();

    let nextPhase: string;
    let result = null;

    if (room.mode === "classic") {
      if (accusedPlayer?.role === "liar") {
        nextPhase = "final_defense";
      } else {
        // 라이어 미지목 → 라이어 승
        const { data: liarPlayer } = await supabase
          .from("players")
          .select("id")
          .eq("room_id", roomId)
          .eq("role", "liar")
          .single();
        result = judgeClassic({
          accusedPlayerId: topPlayerId,
          liarPlayerId: liarPlayer?.id ?? "",
          guessedKeyword: null,
          actualKeyword: room.keyword ?? "",
        });
        nextPhase = "result";
      }
    } else {
      // 바보 모드
      const { data: foolPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("room_id", roomId)
        .eq("role", "fool")
        .single();
      result = judgeFool({
        accusedPlayerId: topPlayerId,
        foolPlayerId: foolPlayer?.id ?? "",
      });
      nextPhase = "result";
    }

    await supabase
      .from("rooms")
      .update({
        phase: nextPhase,
        current_turn_player_id: topPlayerId,
        result,
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .eq("phase", "vote");
  }

  return NextResponse.json({ ok: true });
}
