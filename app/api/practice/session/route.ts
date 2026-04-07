import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSession } from "@/features/practice/createSession";
import type { Direction } from "@/types/practice";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const vocabIds: string[] = Array.isArray(body.vocabIds) ? body.vocabIds : [];
  const grammarIds: string[] = Array.isArray(body.grammarIds) ? body.grammarIds : [];
  console.log("vocabIds", vocabIds);
  console.log("grammarIds", grammarIds);
  const direction: Direction = body.direction ?? "jp-to-en";

  try {
    const result = await createSession({
      userId: session.user.id,
      vocabIds,
      grammarIds,
      direction,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
