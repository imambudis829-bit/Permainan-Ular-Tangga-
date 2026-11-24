export type GameScreen = 'TITLE_MENU' | 'PLAYING' | 'LEADERBOARD' | 'PARENT_DASHBOARD';

export type DifficultyLevel = 'mudah' | 'sedang' | 'menantang';

export type DifficultyMode = 'adaptif' | DifficultyLevel;

export type QuestionCategory = 'rukun_iman' | 'rukun_islam';

export interface QuestionItem {
  id: string;
  category: QuestionCategory;
  pillarNumber: number;
  pillarTitle: string;
  difficulty: DifficultyLevel;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface DrawnQuestion extends QuestionItem {
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
}

export type TileType = 'start' | 'normal' | 'ladder' | 'snake' | 'quiz' | 'bonus' | 'finish';

export type BonusEffectType = 'points_15' | 'points_20' | 'step_2' | 'shield';

export interface TileConfig {
  index: number;
  type: TileType;
  targetIndex?: number;
  bonusEffect?: BonusEffectType;
  title: string;
  fact: string;
}

export interface SnakeOrLadder {
  id: string;
  kind: 'snake' | 'ladder';
  from: number;
  to: number;
  name: string;
  palette: 'emerald' | 'amber' | 'crimson' | 'teal';
}

export interface PillarPerformance {
  correct: number;
  wrong: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  tokenSymbol: string;
  position: number;
  score: number;
  hasShield: boolean;
  correctCount: number;
  wrongCount: number;
  bonusCount: number;
  snakesHit: number;
  laddersClimbed: number;
  reachedFinish: boolean;
  pillarStats: Record<string, PillarPerformance>;
}

export interface QuestionAttemptRecord {
  id: string;
  timestamp: string;
  playerName: string;
  questionId: string;
  category: QuestionCategory;
  pillarTitle: string;
  difficulty: DifficultyLevel;
  prompt: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  pointsDelta: number;
  explanation: string;
}

export interface MatchPlayerSummary {
  name: string;
  score: number;
  position: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  reachedFinish: boolean;
  rank: number;
  pillarStats: Record<string, PillarPerformance>;
}

export interface MatchReportRecord {
  id: string;
  playedAt: string;
  difficultyMode: DifficultyMode;
  winnerName: string;
  winnerScore: number;
  totalTurns: number;
  players: MatchPlayerSummary[];
  attempts: QuestionAttemptRecord[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  reachedFinish: boolean;
  difficultyMode: DifficultyMode;
  playedAt: string;
}

export interface PendingSyncPayload {
  id: string;
  kind: 'leaderboard' | 'report';
  data: LeaderboardEntry | MatchReportRecord;
  createdAt: string;
}
