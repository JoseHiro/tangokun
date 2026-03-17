import { prisma } from "@/lib/prisma";
import type { WordProgress, QuestionResult } from "./types";
import { aggregateSession, updateWordProgress } from "./aggregation";

// ─── DB ↔ domain mapping ──────────────────────────────────────────────────────

function toWordProgress(row: {
  vocabId: string;
  userId: string;
  lifetimeAttempts: number;
  lifetimeCorrect: number;
  recentSessionScores: unknown;
  lastSessionScore: number | null;
  lastSeen: Date | null;
}): WordProgress {
  return {
    wordId: row.vocabId,
    userId: row.userId,
    lifetimeAttempts: row.lifetimeAttempts,
    lifetimeCorrect: row.lifetimeCorrect,
    recentSessionScores: Array.isArray(row.recentSessionScores)
      ? (row.recentSessionScores as number[])
      : [],
    lastSessionScore: row.lastSessionScore,
    lastSeen: row.lastSeen,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Process session results for a user at session end.
 *
 * 1. Aggregates question results into per-word stats
 * 2. Loads existing WordProgress records for affected words
 * 3. Computes updated progress (pure)
 * 4. Upserts all records in a single transaction
 */
export async function saveSessionProgress(
  userId: string,
  results: QuestionResult[],
): Promise<void> {
  if (results.length === 0) return;

  const sessionStats = aggregateSession(results);
  const wordIds = sessionStats.map((s) => s.wordId);

  // Load existing progress for all affected words in one query
  const existing = await prisma.vocabularyProgress.findMany({
    where: { userId, vocabId: { in: wordIds } },
  });
  const existingMap = new Map(existing.map((r) => [r.vocabId, toWordProgress(r)]));

  const now = new Date();

  // Compute updated progress for each word (pure, no IO)
  const updates = sessionStats.map((stats) =>
    updateWordProgress(existingMap.get(stats.wordId) ?? null, stats.wordId, userId, stats, now),
  );

  // Upsert all in one transaction
  await prisma.$transaction(
    updates.map((p) =>
      prisma.vocabularyProgress.upsert({
        where: { userId_vocabId: { userId, vocabId: p.wordId } },
        create: {
          userId,
          vocabId: p.wordId,
          lifetimeAttempts: p.lifetimeAttempts,
          lifetimeCorrect: p.lifetimeCorrect,
          recentSessionScores: p.recentSessionScores,
          lastSessionScore: p.lastSessionScore,
          lastSeen: p.lastSeen,
        },
        update: {
          lifetimeAttempts: p.lifetimeAttempts,
          lifetimeCorrect: p.lifetimeCorrect,
          recentSessionScores: p.recentSessionScores,
          lastSessionScore: p.lastSessionScore,
          lastSeen: p.lastSeen,
        },
      }),
    ),
  );
}

/**
 * Load progress for a set of words belonging to a user.
 * Words with no record yet are not included in the result.
 */
export async function getProgressForWords(
  userId: string,
  wordIds: string[],
): Promise<WordProgress[]> {
  const rows = await prisma.vocabularyProgress.findMany({
    where: { userId, vocabId: { in: wordIds } },
  });
  return rows.map(toWordProgress);
}
