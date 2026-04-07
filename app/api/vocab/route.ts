import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { containsJapanese, VOCAB_LIMITS } from "@/lib/vocab-validation";
import { getMastery } from "@/features/progress/aggregation";
import type { WordProgress } from "@/features/progress/types";
import type { Prisma } from "@prisma/client";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const deckId = searchParams.get("deck") ?? "all";
  const masteryParam = searchParams.get("mastery") ?? "all";

  const where: Prisma.VocabularyWhereInput = { userId };

  // Server-side text search
  if (q) {
    where.OR = [
      { jp: { contains: q, mode: "insensitive" } },
      { en: { contains: q, mode: "insensitive" } },
    ];
  }

  // Deck filter — resolve to a list of vocab IDs
  if (deckId !== "all") {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    const ids = Array.isArray(deck?.vocabIds) ? (deck.vocabIds as string[]) : [];
    where.id = { in: ids };
  }

  // Mastery filter — derive matching word IDs from VocabularyProgress
  if (masteryParam !== "all") {
    const allProgress = await prisma.vocabularyProgress.findMany({
      where: { userId },
      select: { vocabId: true, lifetimeAttempts: true, lifetimeCorrect: true, recentSessionScores: true, lastSessionScore: true, lastSeen: true },
    });

    const practicedIds = new Set(allProgress.map((p) => p.vocabId));

    if (masteryParam === "new") {
      // "new" = never practiced at all
      const existingIdFilter = (where.id as { in?: string[] } | undefined)?.in;
      if (existingIdFilter) {
        where.id = { in: existingIdFilter.filter((id) => !practicedIds.has(id)) };
      } else {
        where.id = { notIn: Array.from(practicedIds) };
      }
    } else {
      const matchingIds = allProgress
        .filter((p) => {
          const prog: WordProgress = {
            wordId: p.vocabId, userId,
            lifetimeAttempts: p.lifetimeAttempts, lifetimeCorrect: p.lifetimeCorrect,
            recentSessionScores: Array.isArray(p.recentSessionScores) ? (p.recentSessionScores as number[]) : [],
            lastSessionScore: p.lastSessionScore, lastSeen: p.lastSeen,
          };
          return getMastery(prog) === masteryParam;
        })
        .map((p) => p.vocabId);

      const existingIdFilter = (where.id as { in?: string[] } | undefined)?.in;
      where.id = { in: existingIdFilter ? existingIdFilter.filter((id) => matchingIds.includes(id)) : matchingIds };
    }
  }

  const [words, total] = await Promise.all([
    prisma.vocabulary.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.vocabulary.count({ where }),
  ]);

  return NextResponse.json({ words, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { jp, en } = await req.json();

  if (!jp?.trim() || !en?.trim()) {
    return NextResponse.json({ error: "jp and en are required" }, { status: 400 });
  }
  if (!containsJapanese(jp)) {
    return NextResponse.json({ error: "jp must contain Japanese characters", code: "JP_NOT_JAPANESE" }, { status: 422 });
  }
  if (jp.length > VOCAB_LIMITS.jpMax) {
    return NextResponse.json({ error: `jp must be ${VOCAB_LIMITS.jpMax} characters or less`, code: "JP_TOO_LONG" }, { status: 422 });
  }
  if (en.length > VOCAB_LIMITS.enMax) {
    return NextResponse.json({ error: `en must be ${VOCAB_LIMITS.enMax} characters or less`, code: "EN_TOO_LONG" }, { status: 422 });
  }

  const existing = await prisma.vocabulary.findFirst({
    where: { userId: session.user.id, jp: jp.trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "Word already exists", code: "DUPLICATE" }, { status: 409 });
  }

  const word = await prisma.vocabulary.create({
    data: { jp: jp.trim(), en: en.trim(), userId: session.user.id },
  });
  return NextResponse.json(word, { status: 201 });
}

const MAX_DELETE_BATCH = 200;

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const userId = session.user.id;

  const body = await req.json();
  const fromArray = Array.isArray(body.ids)
    ? body.ids.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
    : [];
  const ids =
    fromArray.length > 0
      ? [...new Set(fromArray)].slice(0, MAX_DELETE_BATCH)
      : typeof body.id === "string" && body.id
        ? [body.id]
        : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "id or non-empty ids[] is required" }, { status: 400 });
  }

  const result = await prisma.vocabulary.deleteMany({
    where: { userId, id: { in: ids } },
  });

  const singleIdRequest = typeof body.id === "string" && !Array.isArray(body.ids);
  if (singleIdRequest && result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: result.count });
}
