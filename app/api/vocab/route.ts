import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { containsJapanese, VOCAB_LIMITS } from "@/lib/vocab-validation";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const vocab = await prisma.vocabulary.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vocab);
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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Ensure the word belongs to the requesting user
  const word = await prisma.vocabulary.findUnique({ where: { id } });
  if (!word || word.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.vocabulary.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
