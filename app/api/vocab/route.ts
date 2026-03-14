import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
  if (!jp || !en) {
    return NextResponse.json({ error: "jp and en are required" }, { status: 400 });
  }

  const word = await prisma.vocabulary.create({
    data: { jp, en, userId: session.user.id },
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
