import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Strip furigana annotations like 私（わたし） → 私
  const cleanText = text.replace(/（[^）]*）/g, "");

  // ── Azure TTS ──────────────────────────────────────────────────────────────
  const region = process.env.AZURE_SERVICE_REGION;
  const apiKey = process.env.AZURE_API_KEY;

  if (!region || !apiKey) {
    return NextResponse.json({ error: "Azure TTS not configured" }, { status: 500 });
  }

  const voice = Math.random() < 0.5 ? "ja-JP-NanamiNeural" : "ja-JP-KeitaNeural";

  const ssml = `
    <speak version="1.0" xml:lang="ja-JP">
      <voice name="${voice}">
        <prosody rate="-10%">${cleanText}</prosody>
      </voice>
    </speak>
  `.trim();

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Azure TTS error: ${err}` }, { status: 500 });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });

  // ── OpenAI TTS (commented out) ────────────────────────────────────────────
  // import { openai } from "@/lib/openai";
  // const mp3 = await openai.audio.speech.create({
  //   model: "gpt-4o-mini-tts",
  //   voice: "nova",
  //   input: cleanText,
  //   speed: 0.9,
  // });
  // const buffer = Buffer.from(await mp3.arrayBuffer());
  // return new NextResponse(buffer, {
  //   headers: {
  //     "Content-Type": "audio/mpeg",
  //     "Cache-Control": "public, max-age=3600",
  //   },
  // });
}
