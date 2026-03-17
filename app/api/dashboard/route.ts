import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getMastery } from "@/features/progress/aggregation";
import type { WordProgress } from "@/features/progress/types";

/** Returns a deterministic 0-based index for today (changes each calendar day). */
function todayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now = new Date();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalVocab, progressAgg, dueToday, allProgress] = await Promise.all([
    prisma.vocabulary.count({ where: { userId } }),
    prisma.vocabularyProgress.aggregate({
      where: { userId },
      _sum: { lifetimeCorrect: true, lifetimeAttempts: true },
    }),
    // Words not seen in the last 7 days (or never seen) count as "due"
    prisma.vocabularyProgress.count({
      where: { userId, OR: [{ lastSeen: null }, { lastSeen: { lte: sevenDaysAgo } }] },
    }),
    prisma.vocabularyProgress.findMany({ where: { userId } }),
  ]);

  const totalCorrect = progressAgg._sum.lifetimeCorrect ?? 0;
  const total = progressAgg._sum.lifetimeAttempts ?? 0;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

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

  // Word of the day — deterministic per calendar day
  let wordOfTheDay = null;
  if (totalVocab > 0) {
    const skip = todayIndex() % totalVocab;
    const word = await prisma.vocabulary.findFirst({
      where: { userId },
      skip,
      orderBy: { createdAt: "asc" },
      select: { jp: true, en: true },
    });
    if (word) {
      const sentence = await prisma.sentence.findFirst({
        where: { text: { contains: word.jp } },
        orderBy: { createdAt: "desc" },
        select: { text: true, translation: true },
      });
      wordOfTheDay = {
        jp: word.jp,
        en: word.en,
        example: sentence?.text ?? null,
        exampleTranslation: sentence?.translation ?? null,
      };
    }
  }

  return NextResponse.json({ dueToday, totalVocab, accuracy, wordOfTheDay, masteryBreakdown });
}
