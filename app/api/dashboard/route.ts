import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getMastery } from "@/features/progress/aggregation";
import type { WordProgress, MasteryState } from "@/features/progress/types";

const MASTERY_INTERVAL: Record<MasteryState, number> = {
  new:      0,
  learning: 1,
  familiar: 3,
  strong:   7,
  mastered: 14,
};

const STREAK_MIN_QUESTIONS = 10;

function resolveDisplayName(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim() ?? "";
  if (!cleanName) return "user";

  const cleanEmail = email?.trim().toLowerCase() ?? "";
  if (!cleanEmail) return cleanName;

  const lowerName = cleanName.toLowerCase();
  const emailLocal = cleanEmail.split("@")[0] ?? "";

  // If the name is just the email (or local part), treat it as unset.
  if (lowerName === cleanEmail || lowerName === emailLocal) return "user";
  return cleanName;
}

/** Computes the current consecutive-day practice streak from PracticeLog rows.
 *  A day counts only if the user answered at least STREAK_MIN_QUESTIONS questions. */
async function computeStreak(userId: string): Promise<number> {
  const logs = await prisma.practiceLog.findMany({
    where: { userId },
    select: { createdAt: true },
  });
  if (logs.length === 0) return 0;

  // Count questions per UTC day, only include days meeting the minimum
  const countByDay = new Map<string, number>();
  for (const { createdAt } of logs) {
    const day = createdAt.toISOString().slice(0, 10);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }
  const qualifiedDays = new Set(
    Array.from(countByDay.entries())
      .filter(([, count]) => count >= STREAK_MIN_QUESTIONS)
      .map(([day]) => day)
  );

  if (qualifiedDays.size === 0) return 0;

  const now = new Date();
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // If didn't qualify today, allow the streak to continue from yesterday
  if (!qualifiedDays.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - 86_400_000);
    if (!qualifiedDays.has(cursor.toISOString().slice(0, 10))) return 0;
  }

  let streak = 0;
  while (qualifiedDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const displayName = resolveDisplayName(session.user.name, session.user.email);
  const now = new Date();

  const [totalVocab, allProgress, streak] = await Promise.all([
    prisma.vocabulary.count({ where: { userId } }),
    prisma.vocabularyProgress.findMany({ where: { userId } }),
    computeStreak(userId),
  ]);

  // Due for review: practiced before AND interval has elapsed based on mastery
  const dueForReview = allProgress.filter((row) => {
    if (!row.lastSeen) return false; // never practiced → counts as "new", not "review"
    const p: WordProgress = {
      wordId: row.vocabId, userId: row.userId,
      lifetimeAttempts: row.lifetimeAttempts, lifetimeCorrect: row.lifetimeCorrect,
      recentSessionScores: Array.isArray(row.recentSessionScores) ? (row.recentSessionScores as number[]) : [],
      lastSessionScore: row.lastSessionScore, lastSeen: row.lastSeen,
    };
    const mastery = getMastery(p);
    const intervalDays = MASTERY_INTERVAL[mastery];
    const dueDate = new Date(row.lastSeen);
    dueDate.setDate(dueDate.getDate() + intervalDays);
    return dueDate <= now;
  }).length;

  // New words: in vocabulary but never practiced (no progress record)
  const newWordsAvailable = totalVocab - allProgress.length;

  // Recent accuracy: average of each practiced word's rolling session score average.
  // This reflects current skill, not historical accumulation.
  const practicedWords = allProgress.filter(
    (r) => Array.isArray(r.recentSessionScores) && (r.recentSessionScores as number[]).length > 0
  );
  const accuracy =
    practicedWords.length === 0
      ? 0
      : Math.round(
          (practicedWords.reduce((sum, r) => {
            const scores = r.recentSessionScores as number[];
            return sum + scores.reduce((s, v) => s + v, 0) / scores.length;
          }, 0) /
            practicedWords.length) *
            100
        );

  // Mastery breakdown — words with no progress record count as "new"
  const masteryBreakdown = { new: 0, learning: 0, familiar: 0, strong: 0, mastered: 0 };
  for (const row of allProgress) {
    const p: WordProgress = {
      wordId: row.vocabId, userId: row.userId,
      lifetimeAttempts: row.lifetimeAttempts, lifetimeCorrect: row.lifetimeCorrect,
      recentSessionScores: Array.isArray(row.recentSessionScores) ? (row.recentSessionScores as number[]) : [],
      lastSessionScore: row.lastSessionScore, lastSeen: row.lastSeen,
    };
    masteryBreakdown[getMastery(p)]++;
  }
  masteryBreakdown.new += totalVocab - allProgress.length;

  return NextResponse.json({
    displayName,
    dueForReview,
    newWordsAvailable,
    totalVocab,
    accuracy,
    masteryBreakdown,
    streak,
  });
}
