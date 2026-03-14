import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  const [totalVocab, progressAgg, dueToday] = await Promise.all([
    prisma.vocabulary.count({ where: { userId } }),
    prisma.vocabularyProgress.aggregate({
      where: { userId },
      _sum: { correctCount: true, wrongCount: true },
    }),
    prisma.vocabularyProgress.count({ where: { userId, dueDate: { lte: now } } }),
  ]);

  const totalCorrect = progressAgg._sum.correctCount ?? 0;
  const totalWrong = progressAgg._sum.wrongCount ?? 0;
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

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

  return NextResponse.json({ dueToday, totalVocab, accuracy, wordOfTheDay });
}
