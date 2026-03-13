"use client";

import { CreateRoomDialog } from "@/components/home/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/home/JoinRoomDialog";

/* ── 아이콘 (인라인 SVG) ────────────────────────────── */
function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M9 8.25h6m-6 3.75h6m-6 3.75h6M7.5 21h9a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5h-9A1.5 1.5 0 006 5.25v14.25A1.5 1.5 0 007.5 21z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

/* ── 배경 장식 ──────────────────────────────────────── */
function BackgroundDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="dot-grid-bg absolute inset-0 opacity-50" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-15"
        style={{ background: "radial-gradient(ellipse, rgba(230,57,70,0.35) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[300px] opacity-08"
        style={{ background: "radial-gradient(ellipse, rgba(6,214,160,0.3) 0%, transparent 70%)" }}
      />
      <svg className="absolute top-0 right-0 opacity-[0.04] w-72 h-72" viewBox="0 0 200 200">
        {[0,40,80].map(o => <line key={o} x1={o} y1="0" x2="200" y2={200-o} stroke="white" strokeWidth="0.5"/>)}
        {[40,80].map(o => <line key={o+3} x1="0" y1={o} x2={200-o} y2="200" stroke="white" strokeWidth="0.5"/>)}
      </svg>
      <div className="absolute left-6 top-0 bottom-0 w-px"
        style={{ background: "linear-gradient(to bottom, transparent 10%, rgba(230,57,70,0.2) 50%, transparent 90%)" }} />
      <div className="absolute right-6 top-0 bottom-0 w-px"
        style={{ background: "linear-gradient(to bottom, transparent 10%, rgba(230,57,70,0.2) 50%, transparent 90%)" }} />
    </div>
  );
}

/* ── 역할 카드 ──────────────────────────────────────── */
function RoleCard({
  label, sublabel, color, delay, tilt, symbol, question = false,
}: {
  label: string; sublabel: string; color: string;
  delay: string; tilt: string; symbol: string; question?: boolean;
}) {
  return (
    <div
      className="role-card-float game-float-in select-none"
      style={{ animationDelay: delay, "--tilt": tilt } as React.CSSProperties}
    >
      <div
        className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl flex flex-col items-center justify-center gap-2.5 relative overflow-hidden"
        style={{
          background: `linear-gradient(155deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}25`,
          boxShadow: `0 12px 40px ${color}10, inset 0 1px 0 ${color}18`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${color}50, transparent)` }} />
        <div
          className="text-3xl sm:text-4xl"
          style={{ color: question ? "rgba(255,255,255,0.08)" : color, fontFamily: "var(--font-bebas)" }}
        >
          {question ? "?" : symbol}
        </div>
        <div className="text-center px-2 space-y-0.5">
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color, fontFamily: "var(--font-game-mono)" }}>
            {label}
          </p>
          <p className="text-[9px] opacity-40" style={{ fontFamily: "var(--font-game-mono)" }}>
            {sublabel}
          </p>
        </div>
        <div className="absolute bottom-2 right-2.5 text-[9px] opacity-15" style={{ fontFamily: "var(--font-game-mono)", color }}>
          {question ? "??" : "01"}
        </div>
      </div>
    </div>
  );
}

/* ── 히어로 섹션 ─────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pb-32 overflow-hidden scanline-overlay">
      <BackgroundDecor />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-7">
        {/* AI 뱃지 */}
        <div
          className="game-float-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] tracking-[0.3em] uppercase border"
          style={{
            animationDelay: "0ms",
            fontFamily: "var(--font-game-mono)",
            borderColor: "rgba(6,214,160,0.3)",
            color: "#06d6a0",
            background: "rgba(6,214,160,0.05)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current"
            style={{ animation: "dot-blink 2s ease-in-out infinite" }} />
          AI 플레이어 참여 가능
        </div>

        {/* 메인 타이틀 */}
        <div className="game-float-in" style={{ animationDelay: "120ms" }}>
          <p className="text-xs tracking-[0.5em] uppercase mb-1 opacity-30"
            style={{ fontFamily: "var(--font-game-mono)" }}>
            WHO IS THE
          </p>
          <h1
            className="leading-none"
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(5.5rem, 20vw, 13rem)",
              letterSpacing: "0.02em",
              lineHeight: 0.88,
            }}
          >
            <span className="glitch-liar">라이어</span>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>?</span>
          </h1>
        </div>

        {/* 서브타이틀 */}
        <p
          className="game-float-in text-sm sm:text-base max-w-sm leading-relaxed"
          style={{
            animationDelay: "260ms",
            color: "rgba(255,255,255,0.38)",
            fontFamily: "var(--font-game-mono)",
          }}
        >
          링크 하나로 시작하는 심리전.<br />
          <span style={{ color: "#06d6a0" }}>AI</span>가 빈자리를 채우고{" "}
          <span style={{ color: "var(--liar-red)" }}>진실</span>을 분석한다.
        </p>

        {/* CTA */}
        <div className="game-float-in flex flex-col sm:flex-row gap-3" style={{ animationDelay: "380ms" }}>
          <CreateRoomDialog>
            <button
              className="btn-pulse-red relative inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold tracking-[0.2em] uppercase rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontFamily: "var(--font-game-mono)", background: "var(--liar-red)", color: "#fff" }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              방 만들기
            </button>
          </CreateRoomDialog>

          <JoinRoomDialog>
            <button
              className="border-flicker inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold tracking-[0.2em] uppercase rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
              style={{
                fontFamily: "var(--font-game-mono)",
                border: "1px solid rgba(230,57,70,0.35)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              코드 입장
            </button>
          </JoinRoomDialog>
        </div>

        <p className="game-float-in text-[10px] tracking-[0.35em] opacity-20 uppercase"
          style={{ animationDelay: "480ms", fontFamily: "var(--font-game-mono)" }}>
          3 — 8 players · ai included · free
        </p>
      </div>

      {/* 역할 카드 3장 */}
      <div
        className="game-float-in absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-5 z-10"
        style={{ animationDelay: "560ms" }}
      >
        <RoleCard label="시민" sublabel="알고 있다" color="#f4a261" delay="620ms" tilt="-7deg" symbol="♦" />
        <RoleCard label="라이어" sublabel="모른다" color="#e63946" delay="720ms" tilt="0deg" symbol="?" question />
        <RoleCard label="AI" sublabel="분석 중" color="#06d6a0" delay="820ms" tilt="7deg" symbol="◈" />
      </div>
    </section>
  );
}

/* ── 피처 섹션 ──────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { num: "01", icon: <LinkIcon className="w-5 h-5" />, title: "링크로 즉시 시작", desc: "회원가입 없이 닉네임만으로. 생성된 링크를 공유하면 게임 시작.", accent: "#f4a261" },
    { num: "02", icon: <BotIcon className="w-5 h-5" />, title: "AI가 빈자리를 채운다", desc: "인원 부족해도 OK. AI가 시민·라이어·바보 역할로 실제 참여.", accent: "#06d6a0" },
    { num: "03", icon: <ChartIcon className="w-5 h-5" />, title: "AI 사후 분석", desc: "게임 종료 후 핵심 단서, 의심 포인트, 전략을 해설해준다.", accent: "#e63946" },
  ];

  return (
    <section className="relative px-6 py-20 max-w-5xl mx-auto">
      <SectionDivider label="Features" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        {features.map((f) => (
          <div
            key={f.num}
            className="group relative rounded-xl p-6 space-y-4 hover:bg-white/[0.025] transition-colors duration-300"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
              style={{ background: f.accent }} />
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg" style={{ background: `${f.accent}10`, color: f.accent }}>
                {f.icon}
              </div>
              <span className="text-[10px] opacity-18" style={{ fontFamily: "var(--font-game-mono)" }}>{f.num}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.88)" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── 게임 모드 섹션 ─────────────────────────────────── */
function ModesSection() {
  return (
    <section className="px-6 py-16 max-w-5xl mx-auto">
      <SectionDivider label="Game Modes" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">
        <ModeCard
          badge="Classic"
          title="기본 라이어 모드"
          symbol="♠"
          color="#e63946"
          steps={[
            ["라이어 선정", "1명이 제시어를 모른 채 시작"],
            ["턴제 설명", "모두 순서대로 제시어 설명"],
            ["토론 & 투표", "누가 라이어인지 지목"],
            ["역전 기회", "정답 맞히면 라이어 역전!"],
          ]}
          outcomes={[
            { label: "시민 승리", sub: "라이어 지목 + 오답", color: "#f4a261" },
            { label: "라이어 승리", sub: "미지목 또는 정답", color: "#e63946" },
          ]}
        />
        <ModeCard
          badge="Fool Mode"
          title="바보 모드"
          symbol="♣"
          color="#06d6a0"
          steps={[
            ["바보 선정", "AI가 연관 키워드 쌍 생성"],
            ["키워드 배분", "바보만 살짝 다른 키워드"],
            ["바보 모름", "자신이 바보인지 모른 채 설명"],
            ["미묘한 차이", "시민들이 이상함을 캐치"],
          ]}
          outcomes={[
            { label: "시민 승리", sub: "바보 지목", color: "#f4a261" },
            { label: "바보 승리", sub: "바보 미지목", color: "#06d6a0" },
          ]}
        />
      </div>
    </section>
  );
}

function ModeCard({ badge, title, symbol, color, steps, outcomes }: {
  badge: string; title: string; symbol: string; color: string;
  steps: [string, string][]; outcomes: { label: string; sub: string; color: string }[];
}) {
  return (
    <div
      className="relative rounded-2xl p-7 space-y-5 overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${color}08 0%, ${color}02 100%)`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="absolute top-3 right-4 opacity-[0.04] pointer-events-none"
        style={{ fontFamily: "var(--font-bebas)", fontSize: "7rem", lineHeight: 1, color }}>
        {symbol}
      </div>
      <div>
        <span className="inline-block text-[10px] px-2 py-0.5 rounded tracking-widest uppercase mb-2"
          style={{ background: `${color}15`, color, fontFamily: "var(--font-game-mono)" }}>
          {badge}
        </span>
        <h3 className="text-xl font-bold tracking-wide" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
          {title}
        </h3>
      </div>
      <ol className="space-y-2.5">
        {steps.map(([step, desc], i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] mt-0.5"
              style={{ background: `${color}15`, color, fontFamily: "var(--font-game-mono)" }}>
              {i + 1}
            </span>
            <div>
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{step}</span>
              <span className="text-[11px] ml-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>— {desc}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ fontFamily: "var(--font-game-mono)" }}>
        {outcomes.map((o) => (
          <div key={o.label} className="rounded-lg p-2.5 text-center"
            style={{ background: `${o.color}08`, border: `1px solid ${o.color}18`, color: o.color }}>
            {o.label}<br />
            <span className="opacity-45">{o.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 하단 CTA ───────────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="relative px-6 py-28 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-3xl opacity-[0.08]"
        style={{ background: "radial-gradient(ellipse, #e63946 0%, transparent 70%)" }}
      />
      <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
        <h2
          className="leading-tight"
          style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(2.8rem, 9vw, 5rem)", letterSpacing: "0.04em" }}
        >
          지금 바로{" "}
          <span style={{ color: "var(--liar-red)" }}>시작</span>하겠습니까?
        </h2>
        <p className="text-xs opacity-28" style={{ fontFamily: "var(--font-game-mono)" }}>
          회원가입 없음 · 설치 없음 · 링크 하나로
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <CreateRoomDialog>
            <button
              className="btn-pulse-red inline-flex items-center justify-center px-10 py-4 rounded-lg text-sm font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontFamily: "var(--font-game-mono)", background: "var(--liar-red)", color: "#fff" }}
            >
              방 만들기
            </button>
          </CreateRoomDialog>
          <JoinRoomDialog>
            <button
              className="inline-flex items-center justify-center px-10 py-4 rounded-lg text-sm font-semibold tracking-[0.2em] uppercase hover:bg-white/[0.04] transition-colors"
              style={{ fontFamily: "var(--font-game-mono)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}
            >
              코드로 입장
            </button>
          </JoinRoomDialog>
        </div>
      </div>

      <div
        className="relative z-10 mt-14 pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] tracking-[0.3em] opacity-18 uppercase"
        style={{ fontFamily: "var(--font-game-mono)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {["3 ~ 8 Players", "AI Players Included", "Free Forever", "No Login Required"].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </section>
  );
}

/* ── 섹션 구분선 ─────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(230,57,70,0.3))" }} />
      <p className="text-[10px] tracking-[0.4em] uppercase opacity-25" style={{ fontFamily: "var(--font-game-mono)" }}>{label}</p>
      <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(230,57,70,0.3))" }} />
    </div>
  );
}

/* ── 메인 ────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <ModesSection />
      <BottomCTA />
    </div>
  );
}
