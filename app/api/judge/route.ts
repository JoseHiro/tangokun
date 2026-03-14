import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { sentence, userAnswer, expectedTranslation, direction } = await req.json();

  if (!sentence || !userAnswer) {
    return NextResponse.json({ error: "sentence and userAnswer are required" }, { status: 400 });
  }

  const isEnToJp = direction === "en-to-jp";

  let systemPrompt: string;
  let userContent: string;

  if (isEnToJp) {
    const context = sentence ? `The original Japanese sentence is: "${sentence}"` : "";
    systemPrompt = `You are grading an English→Japanese translation exercise. Your ONLY job is to check whether the student wrote a Japanese sentence that correctly conveys the meaning of the English sentence shown.

ALWAYS mark correct if the student got the right meaning, even if their Japanese phrasing differs.
IGNORE completely: politeness level (plain vs polite), minor particle choices, alternative vocab for the same meaning.

Only mark WRONG if the student confused a core element: wrong subject, wrong verb, wrong object, or opposite meaning.

${context}
Respond with JSON:
  correct            — boolean
  feedback           — if wrong: one sentence explaining the core mistake. If correct: empty string ""
  correctTranslation — the Japanese sentence (i.e. the correct answer)`;
    userContent = `English sentence shown to student: ${expectedTranslation}\nStudent's Japanese translation: ${userAnswer}`;
  } else {
    const context = expectedTranslation
      ? `The correct translation is: "${expectedTranslation}"`
      : "";
    systemPrompt = `You are grading a Japanese→English translation exercise. Your ONLY job is to check whether the student understood the meaning of the Japanese sentence.

ALWAYS mark correct if the student got the right idea, even if their English is imperfect.
IGNORE completely: articles (a/an/the), tense (eat/ate/will eat/is eating), plurals, politeness level, word order.

Example: Japanese "私はりんごを食べます" — ALL of these are CORRECT:
  "I eat apple", "I will eat an apple", "I eat apples", "eating apple"

Only mark WRONG if the student confused a core element: wrong subject, wrong verb, wrong object, or opposite meaning.

${context}
Respond with JSON:
  correct            — boolean
  feedback           — if wrong: one sentence explaining the core mistake. If correct: empty string ""
  correctTranslation — a natural English translation of the Japanese sentence`;
    userContent = `Japanese sentence: ${sentence}\nStudent's translation: ${userAnswer}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");

  return NextResponse.json({
    correct: result.correct,
    feedback: result.feedback,
    correctTranslation: result.correctTranslation,
  });
}
