import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callClaude } from "@/lib/ai/claude";
import { keywordsSystemPrompt, keywordsPrompt } from "@/lib/ai/prompts";
import { CATEGORIES } from "@/constants/categories";
import { pickRandomKeyword } from "@/lib/game-logic";

const bodySchema = z.object({
  category: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { category } = parsed.data;

  const result = await callClaude({
    system: keywordsSystemPrompt,
    prompt: keywordsPrompt(category),
    maxTokens: 100,
  });

  // AI 응답 파싱 시도
  if (result) {
    try {
      const jsonMatch = result.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.keyword && parsed.foolKeyword) {
          return NextResponse.json({ keyword: parsed.keyword, foolKeyword: parsed.foolKeyword });
        }
      }
    } catch {
      // 파싱 실패 시 폴백
    }
  }

  // 폴백: 카테고리 키워드에서 두 개 랜덤 선택
  const categoryData = CATEGORIES.find((c) => c.name === category) ?? CATEGORIES[0];
  const keyword = pickRandomKeyword(categoryData.keywords);
  const remaining = categoryData.keywords.filter((k) => k !== keyword);
  const foolKeyword = remaining.length > 0 ? pickRandomKeyword(remaining) : keyword + " (유사)";

  return NextResponse.json({ keyword, foolKeyword });
}
