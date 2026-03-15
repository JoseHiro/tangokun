import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split("@")[0],
      password: hash,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
