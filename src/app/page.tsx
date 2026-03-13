import { Button } from "@/components/ui/button";
import { CreateRoomDialog } from "@/components/home/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/home/JoinRoomDialog";
import { Users, Bot, BarChart2, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-16 py-10">
      {/* 히어로 섹션 */}
      <section className="text-center space-y-5 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <Bot className="h-4 w-4" />
          AI가 실제 플레이어로 참여합니다
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          링크 하나로 시작하는
          <br />
          <span className="text-primary">AI 라이어게임</span>
        </h1>

        <p className="text-lg text-muted-foreground">
          인원이 부족해도 괜찮아요. AI가 빈자리를 채우고,
          <br className="hidden sm:block" />
          게임이 끝나면 AI가 전략을 분석해드립니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <CreateRoomDialog>
            <Button size="lg" className="gap-2 text-base">
              방 만들기 <ChevronRight className="h-4 w-4" />
            </Button>
          </CreateRoomDialog>

          <JoinRoomDialog>
            <Button size="lg" variant="outline" className="gap-2 text-base">
              방 코드로 입장
            </Button>
          </JoinRoomDialog>
        </div>
      </section>

      {/* 특징 카드 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
        <FeatureCard
          icon={<ChevronRight className="h-5 w-5" />}
          title="링크로 즉시 시작"
          description="회원가입 없이 닉네임만으로 방을 만들고 초대 링크를 공유하세요."
        />
        <FeatureCard
          icon={<Bot className="h-5 w-5" />}
          title="AI가 빈자리를 채움"
          description="AI가 시민, 라이어, 바보 역할로 직접 게임에 참여합니다."
        />
        <FeatureCard
          icon={<BarChart2 className="h-5 w-5" />}
          title="AI 사후 분석"
          description="게임이 끝나면 AI가 의심 포인트, 핵심 단서, 전략을 분석합니다."
        />
      </section>

      {/* 게임 규칙 요약 */}
      <section className="w-full max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold text-center">게임 규칙</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RuleCard
            title="기본 라이어 모드"
            steps={[
              "라이어 1명은 제시어를 모름",
              "순서대로 제시어를 설명",
              "토론 후 투표로 라이어를 지목",
              "라이어가 정답을 맞히면 역전!",
            ]}
          />
          <RuleCard
            title="바보 모드"
            steps={[
              "바보 1명은 다른 키워드를 받음",
              "바보는 자신이 바보인지 모름",
              "시민들은 미묘한 차이를 캐치",
              "투표로 바보를 찾아내면 시민 승리",
            ]}
          />
        </div>
      </section>

      {/* 인원 안내 */}
      <section className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        최소 3명 ~ 최대 8명 (AI 포함)
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border p-5 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function RuleCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl border p-5 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <ol className="space-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
