"use client";

import { useState, useEffect, useRef } from "react";

interface UseTimerOptions {
  /** phase_started_at ISO 문자열 */
  startedAt: string | null;
  /** 타이머 전체 시간 (초) */
  durationSec: number;
  /** 만료 시 콜백 */
  onExpire?: () => void;
}

/**
 * 서버 시각(phase_started_at) 기준 카운트다운 타이머.
 * 남은 초(remainingSec)와 진행률(0~1) 반환.
 */
export function useTimer({ startedAt, durationSec, onExpire }: UseTimerOptions) {
  const [remainingSec, setRemainingSec] = useState(durationSec);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!startedAt) {
      setRemainingSec(durationSec);
      expiredRef.current = false;
      return;
    }

    expiredRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      const remaining = Math.max(0, durationSec - elapsed);
      setRemainingSec(Math.ceil(remaining));

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startedAt, durationSec, onExpire]);

  const progress = durationSec > 0 ? remainingSec / durationSec : 0;
  const isExpired = remainingSec <= 0;

  return { remainingSec, progress, isExpired };
}
