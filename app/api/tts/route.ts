import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Strip furigana annotations like 私（わたし） → 私
  const cleanText = text.replace(/（[^）]*）/g, "");

  const mp3 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "nova",
    input: cleanText,
    speed: 0.9,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
