import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getMastery } from "@/features/progress/aggregation";
import type { MasteryState, WordProgress } from "@/features/progress/types";

export type WordProgressSummary = {
  wordId: string;
  mastery: MasteryState;
  lifetimeAttempts: number;
  lifetimeCorrect: number;
  lastSeen: string | null;
};

function toWordProgress(row: {
  vocabId: string; userId: string;
  lifetimeAttempts: number; lifetimeCorrect: number;
  recentSessionScores: unknown; lastSessionScore: number | null;
  lastSeen: Date | null;
}): WordProgress {
  return {
    wordId: row.vocabId,
    userId: row.userId,
    lifetimeAttempts: row.lifetimeAttempts,
    lifetimeCorrect: row.lifetimeCorrect,
    recentSessionScores: Array.isArray(row.recentSessionScores) ? (row.recentSessionScores as number[]) : [],
    lastSessionScore: row.lastSessionScore,
    lastSeen: row.lastSeen,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.vocabularyProgress.findMany({
    where: { userId: session.user.id },
  });

  const result: WordProgressSummary[] = rows.map((row) => {
    const progress = toWordProgress(row);
    return {
      wordId: row.vocabId,
      mastery: getMastery(progress),
      lifetimeAttempts: row.lifetimeAttempts,
      lifetimeCorrect: row.lifetimeCorrect,
      lastSeen: row.lastSeen?.toISOString() ?? null,
    };
  });

  return NextResponse.json(result);
}
