"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const isGamePage = pathname?.startsWith("/room/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
          <Swords className="h-5 w-5 text-primary" />
          <span>LiarGame AI</span>
        </Link>

        {isGamePage && (
          <div className="text-sm text-muted-foreground">
            AI와 함께하는 라이어게임
          </div>
        )}
      </div>
    </header>
  );
}
