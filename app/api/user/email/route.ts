import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmed)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Check if email is already taken by another user
  const existing = await prisma.user.findUnique({
    where: { email: trimmed },
  });

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "Email is already in use" },
      { status: 409 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: trimmed },
  });

  return NextResponse.json({ ok: true });
}
