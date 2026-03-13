"use client";

import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteLinkProps {
  roomCode: string;
}

export function InviteLink({ roomCode }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?join=${roomCode}`
      : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link className="h-3.5 w-3.5" />
        초대 링크
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-semibold tracking-widest text-primary">
            {roomCode}
          </span>
          <span className="text-xs text-muted-foreground truncate hidden sm:block">
            {inviteUrl}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="flex-shrink-0 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              복사
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
