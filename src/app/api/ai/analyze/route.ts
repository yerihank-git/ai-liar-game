import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import { analyzeSystemPrompt, analyzePrompt } from "@/lib/ai/prompts";
import type { AnalysisContent } from "@/types/game";

const bodySchema = z.object({
  roomId: z.string().uuid(),
});

const FALLBACK_ANALYSIS: AnalysisContent = {
  summary: "흥미로운 게임이었습니다. 각 플레이어가 나름의 전략을 구사했습니다.",
  suspicion_points: [],
  key_clues: ["설명의 구체성 차이", "답변 타이밍", "다른 플레이어 반응"],
  strategy_evaluation: [],
  improvement_tips: [
    "설명에서 너무 모호한 표현은 라이어로 의심받을 수 있습니다.",
    "다른 플레이어의 설명에 자연스럽게 호응하는 것이 중요합니다.",
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { roomId } = parsed.data;

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room || room.phase !== "result" || !room.result) {
    return NextResponse.json({ error: "결과 단계가 아닙니다." }, { status: 400 });
  }

  // 이미 분석이 있는지 확인
  const { data: existing } = await supabase
    .from("game_analyses")
    .select("id, analysis_content")
    .eq("room_id", roomId)
    .single();

  if (existing) {
    return NextResponse.json({ analysis: existing.analysis_content });
  }

  // 게임 데이터 조회
  const [{ data: players }, { data: descriptions }, { data: votes }] = await Promise.all([
    supabase.from("players").select("id, nickname, role, is_ai").eq("room_id", roomId),
    supabase.from("descriptions").select("player_id, content").eq("room_id", roomId).order("turn_number"),
    supabase.from("votes").select("voter_id, target_id").eq("room_id", roomId),
  ]);

  const nicknameMap = new Map((players ?? []).map((p) => [p.id, p.nickname]));

  const playerList = (players ?? []).map((p) => ({
    nickname: p.nickname,
    role: p.role ?? "unknown",
    is_ai: p.is_ai,
  }));

  const descList = (descriptions ?? []).map((d) => ({
    nickname: nicknameMap.get(d.player_id) ?? "?",
    content: d.content,
  }));

  const voteList = (votes ?? []).map((v) => ({
    voterNickname: nicknameMap.get(v.voter_id) ?? "?",
    targetNickname: nicknameMap.get(v.target_id) ?? "?",
  }));

  const aiText = await callClaude({
    system: analyzeSystemPrompt,
    prompt: analyzePrompt({
      mode: room.mode,
      category: room.category ?? "",
      keyword: room.keyword ?? "",
      foolKeyword: room.fool_keyword,
      players: playerList,
      descriptions: descList,
      votes: voteList,
      result: room.result,
    }),
    maxTokens: 600,
  });

  let analysis: AnalysisContent = FALLBACK_ANALYSIS;

  if (aiText) {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.summary) {
          // 플레이어 닉네임으로 player_id 매핑
          const idMap = new Map((players ?? []).map((p) => [p.nickname, p.id]));

          analysis = {
            summary: parsed.summary ?? FALLBACK_ANALYSIS.summary,
            suspicion_points: (parsed.suspicion_points ?? []).map((sp: { nickname: string; description: string; suspicion_level: string }) => ({
              player_id: idMap.get(sp.nickname) ?? "",
              nickname: sp.nickname,
              description: sp.description,
              suspicion_level: sp.suspicion_level ?? "medium",
            })),
            key_clues: parsed.key_clues ?? FALLBACK_ANALYSIS.key_clues,
            strategy_evaluation: (parsed.strategy_evaluation ?? []).map((se: { nickname: string; role: string; evaluation: string }) => ({
              player_id: idMap.get(se.nickname) ?? "",
              nickname: se.nickname,
              role: se.role,
              evaluation: se.evaluation,
            })),
            improvement_tips: parsed.improvement_tips ?? FALLBACK_ANALYSIS.improvement_tips,
          };
        }
      }
    } catch {
      // 파싱 실패 — 폴백 사용
    }
  }

  // 분석 결과 저장
  await supabase.from("game_analyses").insert({
    room_id: roomId,
    analysis_content: analysis,
  });

  return NextResponse.json({ analysis });
}
