import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalVocab, practiceAgg, todayCount, dueToday] = await Promise.all([
    prisma.vocabulary.count({ where: { userId } }),
    prisma.vocabularyProgress.aggregate({
      where: { userId },
      _sum: { lifetimeCorrect: true, lifetimeAttempts: true },
    }),
    prisma.practiceLog.count({
      where: { userId, createdAt: { gte: todayStart } },
    }),
    prisma.vocabularyProgress.count({
      where: { userId, OR: [{ lastSeen: null }, { lastSeen: { lte: sevenDaysAgo } }] },
    }),
  ]);

  const totalCorrect = practiceAgg._sum.lifetimeCorrect ?? 0;
  const totalAttempts = practiceAgg._sum.lifetimeAttempts ?? 0;
  const totalWrong = totalAttempts - totalCorrect;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return NextResponse.json({ totalVocab, totalCorrect, totalWrong, accuracy, todayCount, dueToday });
}
