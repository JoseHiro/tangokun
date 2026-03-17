import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveSessionProgress } from "@/features/progress/progressService";
import type { QuestionResult } from "@/features/progress/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const results: QuestionResult[] = Array.isArray(body.results) ? body.results : [];

  if (results.length === 0) {
    return NextResponse.json({ error: "results is required" }, { status: 400 });
  }

  await saveSessionProgress(session.user.id, results);
  return NextResponse.json({ ok: true });
}
