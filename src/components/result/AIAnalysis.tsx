"use client";

import { useEffect, useState } from "react";
import type { AnalysisContent } from "@/types/game";

interface AIAnalysisProps {
  roomId: string;
}

const SUSPICION_COLOR = {
  low: "rgba(6,214,160,0.6)",
  medium: "rgba(244,162,97,0.8)",
  high: "rgba(230,57,70,0.9)",
};

const SUSPICION_LABEL = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};

export function AIAnalysis({ roomId }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/ai/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data.analysis);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  if (loading) {
    return (
      <div
        className="rounded-xl px-5 py-4 space-y-2"
        style={{ background: "rgba(6,214,160,0.05)", border: "1px solid rgba(6,214,160,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--ai-teal)", fontFamily: "var(--font-game-mono, monospace)" }}>
            AI
          </span>
          <span className="text-sm font-semibold">분석 중...</span>
          <span className="animate-pulse text-xs opacity-40">Claude가 게임을 분석하고 있습니다</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(6,214,160,0.15)", color: "var(--ai-teal)", fontFamily: "var(--font-game-mono, monospace)" }}
        >
          AI 분석
        </span>
        <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.08em" }}>
          Claude의 게임 분석
        </span>
      </div>

      {/* 요약 */}
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: "rgba(6,214,160,0.06)", border: "1px solid rgba(6,214,160,0.15)" }}
      >
        <p className="text-sm leading-relaxed opacity-90">{analysis.summary}</p>
      </div>

      {/* 의심도 분석 */}
      {analysis.suspicion_points.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 tracking-widest uppercase" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            의심도 분석
          </p>
          <div className="space-y-2">
            {analysis.suspicion_points.map((sp, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-2.5 flex gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="shrink-0 mt-0.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: `${SUSPICION_COLOR[sp.suspicion_level]}20`,
                      color: SUSPICION_COLOR[sp.suspicion_level],
                      fontFamily: "var(--font-game-mono, monospace)",
                    }}
                  >
                    {SUSPICION_LABEL[sp.suspicion_level]}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">{sp.nickname}</span>
                  <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{sp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 단서 */}
      {analysis.key_clues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 tracking-widest uppercase" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            핵심 단서
          </p>
          <ul className="space-y-1">
            {analysis.key_clues.map((clue, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span style={{ color: "var(--citizen-gold)" }}>•</span>
                <span className="opacity-80">{clue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 전략 평가 */}
      {analysis.strategy_evaluation.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 tracking-widest uppercase" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            전략 평가
          </p>
          <div className="space-y-2">
            {analysis.strategy_evaluation.map((se, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{se.nickname}</span>
                  <span className="text-xs opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
                    {se.role}
                  </span>
                </div>
                <p className="text-xs opacity-70 leading-relaxed">{se.evaluation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 개선 팁 */}
      {analysis.improvement_tips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 tracking-widest uppercase" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            다음 게임 팁
          </p>
          <ul className="space-y-1">
            {analysis.improvement_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span style={{ color: "var(--ai-teal)" }}>→</span>
                <span className="opacity-80">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
