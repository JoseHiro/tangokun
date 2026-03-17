export type MasteryState = "new" | "learning" | "familiar" | "strong" | "mastered";

/**
 * Persisted per-word progress for a user.
 * Stored in the VocabularyProgress table.
 */
export interface WordProgress {
  wordId: string;
  userId: string;
  lifetimeAttempts: number;
  lifetimeCorrect: number;
  /** Rolling window of the last 20 session scores (0–1). */
  recentSessionScores: number[];
  lastSessionScore: number | null;
  lastSeen: Date | null;
}

/**
 * One question's outcome inside a practice session.
 * wordId is the primary vocab word the question was built around.
 */
export interface QuestionResult {
  wordId: string;
  correct: boolean;
}

/**
 * Per-word aggregate computed from a session's QuestionResults
 * before writing back to the DB.
 */
export interface WordSessionStats {
  wordId: string;
  attempts: number;
  correct: number;
  /** correct / attempts  (0 when attempts === 0, should never happen in practice) */
  score: number;
}
