import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVocabCSV } from "@/lib/csv-parser";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors } = parseVocabCSV(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found.", parseErrors: errors },
      { status: 422 }
    );
  }

  // Skip exact duplicates within this user's vocabulary
  const existing = await prisma.vocabulary.findMany({
    where: { userId },
    select: { jp: true },
  });
  const existingSet = new Set(existing.map((w) => w.jp));

  const newRows = rows.filter((r) => !existingSet.has(r.jp)).map((r) => ({ ...r, userId }));
  const skipped = rows.length - newRows.length;

  let imported = 0;
  if (newRows.length > 0) {
    const result = await prisma.vocabulary.createMany({ data: newRows });
    imported = result.count;
  }

  return NextResponse.json({ imported, skipped, parseErrors: errors });
}
