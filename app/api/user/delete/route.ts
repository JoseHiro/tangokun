import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const { confirm } = body;

  if (!confirm || typeof confirm !== "string") {
    return NextResponse.json({ error: "confirm is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return unauthorized();

  const validConfirm =
    confirm === user.name || confirm === user.email;

  if (!validConfirm) {
    return NextResponse.json(
      { error: "Confirmation text does not match your name or email" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // Manually delete models without cascade
  await prisma.vocabularyProgress.deleteMany({ where: { userId } });
  await prisma.mistakeLog.deleteMany({ where: { userId } });
  await prisma.practiceLog.deleteMany({ where: { userId } });

  // Delete user (cascades to Vocabulary, Deck, Account, Session)
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
