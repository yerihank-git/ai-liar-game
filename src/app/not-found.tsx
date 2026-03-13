import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="space-y-3">
        <p
          className="text-8xl font-bold"
          style={{
            fontFamily: "var(--font-bebas, sans-serif)",
            letterSpacing: "0.05em",
            color: "var(--liar-red)",
            opacity: 0.6,
          }}
        >
          404
        </p>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em" }}
        >
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-sm opacity-50 max-w-xs">
          방이 존재하지 않거나 이미 종료되었을 수 있습니다.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "var(--liar-red)", color: "#fff" }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
