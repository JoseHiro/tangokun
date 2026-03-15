import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Update deck name and/or vocabIds */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: { name?: string; vocabIds?: string[] } = {};

  if (typeof body.name === "string") {
    updates.name = body.name.trim() || deck.name;
  }
  if (Array.isArray(body.vocabIds)) {
    updates.vocabIds = body.vocabIds.filter(
      (v: unknown): v is string => typeof v === "string"
    );
  }

  const updated = await prisma.deck.update({
    where: { id },
    data: updates,
  });
  return NextResponse.json(updated);
}

/** Delete deck */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  await prisma.deck.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
