import type { WordProgress, QuestionResult, WordSessionStats, MasteryState } from "./types";

const RECENT_SCORES_WINDOW = 10;

// ─── Session aggregation ──────────────────────────────────────────────────────

/**
 * Collapse all question results from a session into per-word stats.
 * One word may appear multiple times; this groups and sums those appearances.
 *
 * @example
 * aggregateSession([
 *   { wordId: "abc", correct: true },
 *   { wordId: "abc", correct: false },
 * ])
 * // → [{ wordId: "abc", attempts: 2, correct: 1, score: 0.5 }]
 */
export function aggregateSession(results: QuestionResult[]): WordSessionStats[] {
  const byWord = new Map<string, { attempts: number; correct: number }>();

  for (const { wordId, correct } of results) {
    const entry = byWord.get(wordId) ?? { attempts: 0, correct: 0 };
    entry.attempts += 1;
    if (correct) entry.correct += 1;
    byWord.set(wordId, entry);
  }

  return Array.from(byWord.entries()).map(([wordId, { attempts, correct }]) => ({
    wordId,
    attempts,
    correct,
    score: attempts > 0 ? correct / attempts : 0,
  }));
}

// ─── Progress update ──────────────────────────────────────────────────────────

/**
 * Pure function — takes the existing WordProgress (or null for a brand-new word)
 * and a session's stats for that word, and returns the updated WordProgress.
 *
 * Does NOT write to the database. The caller is responsible for persistence.
 */
export function updateWordProgress(
  existing: WordProgress | null,
  wordId: string,
  userId: string,
  stats: WordSessionStats,
  now: Date = new Date(),
): WordProgress {
  const base: WordProgress = existing ?? {
    wordId,
    userId,
    lifetimeAttempts: 0,
    lifetimeCorrect: 0,
    recentSessionScores: [],
    lastSessionScore: null,
    lastSeen: null,
  };

  const recentSessionScores = [...base.recentSessionScores, stats.score];
  if (recentSessionScores.length > RECENT_SCORES_WINDOW) {
    recentSessionScores.shift();
  }

  return {
    ...base,
    lifetimeAttempts: base.lifetimeAttempts + stats.attempts,
    lifetimeCorrect: base.lifetimeCorrect + stats.correct,
    recentSessionScores,
    lastSessionScore: stats.score,
    lastSeen: now,
  };
}

// ─── Mastery ──────────────────────────────────────────────────────────────────

/**
 * Derive a human-readable mastery state from a WordProgress record.
 *
 * Both the score threshold AND a minimum session count must be met to advance.
 * This prevents a single lucky session from inflating mastery.
 *
 *   new       — never practiced
 *   learning  — fewer than 3 sessions (not enough data yet, regardless of score)
 *   familiar  — ≥ 3 sessions AND recentAvg ≥ 0.60
 *   strong    — ≥ 5 sessions AND recentAvg ≥ 0.80
 *   mastered  — ≥ 8 sessions AND recentAvg ≥ 0.90
 */
export function getMastery(progress: WordProgress): MasteryState {
  const sessions = progress.recentSessionScores.length;

  if (sessions === 0) return "new";
  if (sessions < 3) return "learning";

  const recentAvg = progress.recentSessionScores.reduce((sum, s) => sum + s, 0) / sessions;

  if (sessions >= 8 && recentAvg >= 0.9) return "mastered";
  if (sessions >= 5 && recentAvg >= 0.8) return "strong";
  if (recentAvg >= 0.6) return "familiar";
  return "learning";
}

// ─── Convenience ─────────────────────────────────────────────────────────────

/**
 * Compute the lifetime accuracy (0–1) for display purposes.
 * Returns null when the word has never been attempted.
 */
export function getLifetimeAccuracy(progress: WordProgress): number | null {
  if (progress.lifetimeAttempts === 0) return null;
  return progress.lifetimeCorrect / progress.lifetimeAttempts;
}
