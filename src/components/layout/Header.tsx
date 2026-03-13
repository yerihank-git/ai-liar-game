"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const isGamePage = pathname?.startsWith("/room/");

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,8,15,0.85)" }}
    >
      <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-75 transition-opacity group"
        >
          <Swords
            className="h-4 w-4 transition-colors duration-200"
            style={{ color: "var(--liar-red)" }}
          />
          <span
            className="font-bold text-sm tracking-[0.15em] uppercase"
            style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.15em", fontSize: "1.05rem" }}
          >
            LiarGame
            <span className="ml-1 text-xs font-normal tracking-widest opacity-40" style={{ fontFamily: "var(--font-game-mono, monospace)" }}>
              AI
            </span>
          </span>
        </Link>

        {isGamePage && (
          <div
            className="text-[10px] tracking-[0.3em] uppercase opacity-35"
            style={{ fontFamily: "var(--font-game-mono, monospace)" }}
          >
            in game
          </div>
        )}
      </div>
    </header>
  );
}
