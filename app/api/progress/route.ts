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

  const [totalVocab, practiceAgg, todayCount, dueToday] = await Promise.all([
    prisma.vocabulary.count({ where: { userId } }),
    prisma.vocabularyProgress.aggregate({
      where: { userId },
      _sum: { correctCount: true, wrongCount: true },
    }),
    prisma.practiceLog.count({
      where: { userId, createdAt: { gte: todayStart } },
    }),
    prisma.vocabularyProgress.count({
      where: { userId, dueDate: { lte: now } },
    }),
  ]);

  const totalCorrect = practiceAgg._sum.correctCount ?? 0;
  const totalWrong = practiceAgg._sum.wrongCount ?? 0;
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return NextResponse.json({ totalVocab, totalCorrect, totalWrong, accuracy, todayCount, dueToday });
}
