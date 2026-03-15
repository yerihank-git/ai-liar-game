import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 300;
const TIMEOUT_MS = 8000;

export interface AiCallOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

/**
 * Claude API 단일 텍스트 응답 호출.
 * 타임아웃(8초) + 실패 시 null 반환 (호출부에서 폴백 처리).
 */
export async function callClaude(options: AiCallOptions): Promise<string | null> {
  const { system, prompt, maxTokens = MAX_TOKENS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);

    const block = message.content[0];
    if (block.type === "text") return block.text.trim();
    return null;
  } catch (err) {
    clearTimeout(timer);
    console.error("[callClaude] error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/** 랜덤 딜레이 (ms): AI 플레이어가 생각하는 것처럼 자연스럽게 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
}
