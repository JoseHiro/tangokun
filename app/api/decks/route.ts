import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const MAX_DECKS = 5;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** List current user's decks */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(decks);
}

/** Create a new deck (default name "Deck 1", "Deck 2", ...) */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const count = await prisma.deck.count({ where: { userId: session.user.id } });
  if (count >= MAX_DECKS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DECKS} decks allowed.` },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Deck ${count + 1}`;

  const deck = await prisma.deck.create({
    data: {
      userId: session.user.id,
      name,
      vocabIds: [],
    },
  });
  return NextResponse.json(deck, { status: 201 });
}
