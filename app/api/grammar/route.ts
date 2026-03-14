import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level"); // e.g. "N4" or null for all

  const grammar = await prisma.grammar.findMany({
    where: level ? { jlptLevel: level } : undefined,
    select: { id: true, pattern: true, meaning: true, example: true, translation: true, jlptLevel: true, source: true },
    orderBy: [{ jlptLevel: "desc" }, { pattern: "asc" }],
  });

  return NextResponse.json(grammar);
}
