import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeNextReview } from "@/lib/spaced-repetition";

type RecordBody = {
  vocabIds: string[];
  correct: boolean;
  sentence: string;
  studentAnswer: string;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body: RecordBody = await req.json();
  const { vocabIds, correct, sentence, studentAnswer } = body;

  if (!Array.isArray(vocabIds) || vocabIds.length === 0) {
    return NextResponse.json({ error: "vocabIds required" }, { status: 400 });
  }

  // Create one PracticeLog entry
  await prisma.practiceLog.create({ data: { userId, correct } });

  // Upsert VocabularyProgress for each vocab word
  const existingProgress = await prisma.vocabularyProgress.findMany({
    where: { userId, vocabId: { in: vocabIds } },
  });
  const progressMap = new Map(existingProgress.map((p: { vocabId: string; interval: number; ease: number }) => [p.vocabId, p]));

  const upserts = vocabIds.map((vocabId) => {
    const existing = progressMap.get(vocabId);
    const interval = existing?.interval ?? 1;
    const ease = existing?.ease ?? 2;
    const { interval: newInterval, dueDate } = computeNextReview(correct, interval, ease);

    return prisma.vocabularyProgress.upsert({
      where: { userId_vocabId: { userId, vocabId } },
      create: {
        userId,
        vocabId,
        interval: newInterval,
        ease,
        dueDate,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1,
      },
      update: {
        interval: newInterval,
        dueDate,
        correctCount: correct ? { increment: 1 } : undefined,
        wrongCount: correct ? undefined : { increment: 1 },
      },
    });
  });

  // Create MistakeLogs if wrong
  const mistakeLogs = !correct
    ? vocabIds.map((vocabId) =>
        prisma.mistakeLog.create({ data: { userId, vocabId, sentence, studentAnswer } })
      )
    : [];

  await Promise.all([...upserts, ...mistakeLogs]);

  return NextResponse.json({ ok: true });
}
