// ── 열거 타입 ─────────────────────────────────────────────

export type GameMode = "classic" | "fool";

export type GamePhase =
  | "waiting"
  | "role_reveal"
  | "description"
  | "discussion"
  | "vote"
  | "final_defense"
  | "result";

export type PlayerRole = "citizen" | "liar" | "fool";

export type GameWinner = "citizens" | "liar" | "fool";

// ── DB 행 타입 ────────────────────────────────────────────

export interface Room {
  id: string;
  room_code: string;
  host_player_id: string | null;
  mode: GameMode;
  phase: GamePhase;
  category: string | null;
  keyword: string | null;
  fool_keyword: string | null;
  current_turn_player_id: string | null;
  turn_order: string[]; // player id 배열
  description_timer_sec: number;
  discussion_timer_sec: number;
  vote_timer_sec: number;
  final_defense_timer_sec: number;
  phase_started_at: string | null;
  max_players: number;
  result: GameResult | null;
  created_at: string;
  updated_at: string;
}

export interface GameResult {
  winner: GameWinner;
  liar_player_id?: string;
  fool_player_id?: string;
  guessed_keyword?: string;
  correct_guess?: boolean;
}

export interface Player {
  id: string;
  room_id: string;
  nickname: string;
  is_ai: boolean;
  is_host: boolean;
  role: PlayerRole | null;
  is_connected: boolean;
  role_confirmed: boolean;
  session_token: string;
  created_at: string;
  updated_at: string;
}

export interface Description {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
  turn_number: number;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
  created_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  voter_id: string;
  target_id: string;
  created_at: string;
}

export interface GameAnalysis {
  id: string;
  room_id: string;
  analysis_content: AnalysisContent;
  created_at: string;
}

export interface AnalysisContent {
  suspicion_points: SuspicionPoint[];
  key_clues: string[];
  strategy_evaluation: StrategyEvaluation[];
  improvement_tips: string[];
  summary: string;
}

export interface SuspicionPoint {
  player_id: string;
  nickname: string;
  description: string;
  suspicion_level: "low" | "medium" | "high";
}

export interface StrategyEvaluation {
  player_id: string;
  nickname: string;
  role: PlayerRole;
  evaluation: string;
}

// ── 클라이언트 상태 타입 ──────────────────────────────────

export interface PlayerSession {
  playerId: string;
  sessionToken: string;
  nickname: string;
  roomId: string;
}

// ── API 요청/응답 타입 ────────────────────────────────────

export interface CreateRoomRequest {
  nickname: string;
}

export interface CreateRoomResponse {
  roomId: string;
  playerId: string;
  sessionToken: string;
}

export interface JoinRoomRequest {
  nickname: string;
  sessionToken: string;
}

export interface JoinRoomResponse {
  playerId: string;
}

export interface ApiError {
  error: string;
}
