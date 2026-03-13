"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.25)" }}
      >
        ⚠
      </div>

      <div className="space-y-2">
        <h2
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em", color: "var(--liar-red)" }}
        >
          오류 발생
        </h2>
        <p className="text-sm opacity-60 max-w-sm">
          예상치 못한 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs opacity-30" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
            #{error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          홈으로
        </Button>
      </div>
    </div>
  );
}
