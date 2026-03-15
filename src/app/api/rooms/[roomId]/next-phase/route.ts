import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { countVotes, judgeFool, judgeClassic } from "@/lib/game-logic";
import type { Vote } from "@/types/game";

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
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }

  // 방장 or 서버 내부 호출 검증
  const { data: player } = await supabase
    .from("players")
    .select("id, is_host")
    .eq("room_id", roomId)
    .eq("session_token", parsed.data.sessionToken)
    .single();

  if (!player) {
    return NextResponse.json({ error: "인증 실패" }, { status: 403 });
  }

  const now = new Date().toISOString();

  switch (room.phase) {
    case "role_reveal": {
      // role_reveal → description
      // .eq("phase", "role_reveal"): 동시 요청 중 먼저 실행된 것만 반영 (낙관적 잠금)
      await supabase
        .from("rooms")
        .update({ phase: "description", phase_started_at: now })
        .eq("id", roomId)
        .eq("phase", "role_reveal");
      break;
    }

    case "description": {
      // description → discussion (타이머 만료 시)
      await supabase
        .from("rooms")
        .update({ phase: "discussion", current_turn_player_id: null, phase_started_at: now })
        .eq("id", roomId)
        .eq("phase", "description");
      break;
    }

    case "discussion": {
      // discussion → vote (모든 설명 완료 후 토론 종료)
      await supabase
        .from("rooms")
        .update({ phase: "vote", phase_started_at: now })
        .eq("id", roomId)
        .eq("phase", "discussion");
      break;
    }

    case "vote": {
      // 투표 미완료 플레이어 랜덤 처리 후 집계
      const { data: allPlayers } = await supabase
        .from("players")
        .select("id")
        .eq("room_id", roomId);

      const { data: existingVotes } = await supabase
        .from("votes")
        .select("*")
        .eq("room_id", roomId);

      const votedIds = new Set((existingVotes ?? []).map((v) => v.voter_id));
      const unvoted = (allPlayers ?? []).filter((p) => !votedIds.has(p.id));

      // 미투표자 랜덤 투표 처리
      for (const p of unvoted) {
        const others = (allPlayers ?? []).filter((op) => op.id !== p.id);
        if (others.length > 0) {
          const target = others[Math.floor(Math.random() * others.length)];
          await supabase.from("votes").upsert(
            { room_id: roomId, voter_id: p.id, target_id: target.id },
            { onConflict: "room_id,voter_id" }
          );
        }
      }

      const { data: finalVotes } = await supabase
        .from("votes")
        .select("*")
        .eq("room_id", roomId);

      const { topPlayerId, isTie } = countVotes(finalVotes as Vote[]);

      if (isTie) {
        // 동점 재투표
        await supabase.from("votes").delete().eq("room_id", roomId);
        await supabase.from("rooms").update({ phase_started_at: now }).eq("id", roomId);
        return NextResponse.json({ ok: true, tie: true });
      }

      const { data: accused } = await supabase
        .from("players")
        .select("role")
        .eq("id", topPlayerId!)
        .single();

      let nextPhase: string;
      let result = null;

      if (room.mode === "classic") {
        if (accused?.role === "liar") {
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
          phase_started_at: now,
        })
        .eq("id", roomId)
        .eq("phase", "vote");
      break;
    }

    case "final_defense": {
      // 타이머 만료 — 라이어 정답 실패 처리
      const { data: liarPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("room_id", roomId)
        .eq("role", "liar")
        .single();

      const result = judgeClassic({
        accusedPlayerId: room.current_turn_player_id,
        liarPlayerId: liarPlayer?.id ?? "",
        guessedKeyword: null,
        actualKeyword: room.keyword ?? "",
      });

      await supabase
        .from("rooms")
        .update({ phase: "result", result, phase_started_at: now })
        .eq("id", roomId)
        .eq("phase", "final_defense");
      break;
    }

    case "result": {
      // result → waiting (다시하기)
      await supabase
        .from("rooms")
        .update({
          phase: "waiting",
          keyword: null,
          fool_keyword: null,
          turn_order: [],
          current_turn_player_id: null,
          result: null,
          phase_started_at: null,
        })
        .eq("id", roomId);

      // 플레이어 역할 초기화
      await supabase
        .from("players")
        .update({ role: null, role_confirmed: false })
        .eq("room_id", roomId);

      // 게임 데이터 초기화
      await supabase.from("descriptions").delete().eq("room_id", roomId);
      await supabase.from("votes").delete().eq("room_id", roomId);
      await supabase.from("messages").delete().eq("room_id", roomId);
      break;
    }

    default:
      return NextResponse.json({ error: "전환할 수 없는 단계입니다." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
