"use client";

import { useEffect, useRef, useState } from "react";
const BGM_SRC = "/bgm/tanam2vqti.m4a";

export function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  // 첫 인터랙션 시 재생 시작 (브라우저 autoplay 정책 대응)
  useEffect(() => {
    const start = () => {
      if (started) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.play().catch(() => {});
      setStarted(true);
    };

    window.addEventListener("click", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("touchstart", start, { once: true });

    return () => {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
  }, [started]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (!started) {
      audio.play().catch(() => {});
      setStarted(true);
      setMuted(false);
      return;
    }

    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={BGM_SRC}
        loop
        preload="auto"
        style={{ display: "none" }}
      />
      <button
        onClick={toggle}
        aria-label={muted ? "BGM 켜기" : "BGM 끄기"}
        title={muted ? "BGM 켜기" : "BGM 끄기"}
        className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        {muted || !started ? (
          // 음소거 아이콘
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M10.5 4.5L6 9H3.75A.75.75 0 003 9.75v4.5c0 .414.336.75.75.75H6l4.5 4.5V4.5z"
            />
          </svg>
        ) : (
          // 재생 중 아이콘
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
