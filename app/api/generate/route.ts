import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { auth } from "@/auth";

export type UsedWord = { id: string; jp: string; en: string };
export type Direction = "jp-to-en" | "en-to-jp";

/** Pick `n` random elements from an array without repetition. */
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * (copy.length - i));
    result.push(copy[idx]);
    copy[idx] = copy[copy.length - i - 1];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const force: boolean = body.force === true;
  const direction: Direction = body.direction ?? "jp-to-en";
  const vocabIds: string[] = Array.isArray(body.vocabIds) ? body.vocabIds : [];
  const grammarIds: string[] = Array.isArray(body.grammarIds) ? body.grammarIds : [];

  // Pick a random grammar pattern if any selected
  let grammar: { id: string; pattern: string; meaning: string; example: string | null } | null = null;
  if (grammarIds.length > 0) {
    const pickedId = grammarIds[Math.floor(Math.random() * grammarIds.length)];
    grammar = await prisma.grammar.findUnique({
      where: { id: pickedId },
      select: { id: true, pattern: true, meaning: true, example: true },
    });
  }

  const useAllVocab = vocabIds.length === 0;
  const hasGrammar = grammar !== null;

  // --- Sentence cache: only used when using all vocab with no grammar ---
  if (useAllVocab && !hasGrammar && !force) {
    const cachedCount = await prisma.sentence.count();
    if (cachedCount > 0) {
      const skip = Math.floor(Math.random() * cachedCount);
      const cached = await prisma.sentence.findFirst({
        skip,
        orderBy: { createdAt: "desc" },
      });
      if (cached) {
        const rawWords = cached.usedWords as Array<{ id?: string; jp: string; en: string }>;
        const jpValues = rawWords.map((w) => w.jp);
        const dbWords = await prisma.vocabulary.findMany({
          where: { userId, jp: { in: jpValues } },
          select: { id: true, jp: true, en: true },
        });
        const idMap = new Map(
          dbWords.map((w: { id: string; jp: string; en: string }) => [w.jp, w.id])
        );
        const enriched: UsedWord[] = rawWords.map((w) => ({
          id: w.id ?? idMap.get(w.jp) ?? "",
          jp: w.jp,
          en: w.en,
        }));
        return NextResponse.json({
          sentence: cached.text,
          translation: cached.translation,
          furigana: cached.furigana,
          usedWords: enriched,
          cached: true,
          grammarUsed: null,
          direction,
        });
      }
    }
  }

  // --- Grammar-only: no vocab ---
  if (hasGrammar && vocabIds.length === 0) {
    // Check if any vocab exists; if none, do grammar-only
    const vocabCount = await prisma.vocabulary.count({ where: { userId } });
    if (vocabCount === 0) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Japanese language teacher.
Create a simple, natural Japanese sentence demonstrating the grammar pattern provided.
Rules:
- The sentence must clearly use the grammar pattern.
- Beginner-to-intermediate level.
Return a JSON object with exactly these fields:
  sentence    — the Japanese sentence
  translation — natural English translation
  furigana    — full hiragana/furigana reading of the sentence`,
          },
          {
            role: "user",
            content: `Grammar pattern: ${grammar!.pattern} (${grammar!.meaning})
${grammar!.example ? `Example usage: ${grammar!.example}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const result = JSON.parse(completion.choices[0].message.content ?? "{}");
      return NextResponse.json({
        sentence: result.sentence,
        translation: result.translation,
        furigana: result.furigana,
        usedWords: [],
        cached: false,
        grammarUsed: { pattern: grammar!.pattern, meaning: grammar!.meaning },
        direction,
      });
    }
  }

  // --- Load vocab (all or selected) ---
  const allWords = await prisma.vocabulary.findMany({
    where: {
      userId,
      ...(vocabIds.length > 0 ? { id: { in: vocabIds } } : {}),
    },
    select: { id: true, jp: true, en: true },
  });

  if (allWords.length === 0) {
    return NextResponse.json({ error: "No vocabulary words available. Add some words first." }, { status: 400 });
  }

  const wordCount = Math.min(allWords.length, 1 + Math.floor(Math.random() * 2));
  const chosenWords = sample(allWords, wordCount);
  const vocabList = chosenWords.map((w) => `${w.jp} (${w.en})`).join("\n");

  let systemPrompt: string;
  let userPrompt: string;

  if (hasGrammar) {
    systemPrompt = `You are a Japanese language teacher.
Create a simple, natural Japanese sentence that uses BOTH the grammar pattern AND as many vocabulary words as possible.
Rules:
- The sentence must clearly demonstrate the grammar pattern.
- Use as many of the listed vocabulary words as possible.
- Beginner-to-intermediate level.
Return a JSON object with exactly these fields:
  sentence    — the Japanese sentence
  translation — natural English translation
  furigana    — full hiragana/furigana reading of the sentence`;
    userPrompt = `Grammar pattern: ${grammar!.pattern} (${grammar!.meaning})
${grammar!.example ? `Example usage: ${grammar!.example}` : ""}

Vocabulary:\n${vocabList}`;
  } else {
    systemPrompt = `You are a Japanese language teacher.
Create a simple, natural Japanese sentence using ONLY the vocabulary words provided.
Rules:
- Use as many of the listed words as possible.
- The sentence should be beginner-to-intermediate level.
- Add common grammar particles and basic verbs (は、が、を、に、です、ます etc.) as needed.
Return a JSON object with exactly these fields:
  sentence    — the Japanese sentence
  translation — natural English translation
  furigana    — full hiragana/furigana reading of the sentence`;
    userPrompt = `Vocabulary:\n${vocabList}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");

  // Only cache vocab-only (all vocab, no grammar) sentences
  if (useAllVocab && !hasGrammar) {
    const saved = await prisma.sentence.create({
      data: {
        text: result.sentence,
        translation: result.translation,
        furigana: result.furigana,
        usedWords: chosenWords,
      },
    });
    return NextResponse.json({
      sentence: saved.text,
      translation: saved.translation,
      furigana: saved.furigana,
      usedWords: saved.usedWords as UsedWord[],
      cached: false,
      grammarUsed: null,
      direction,
    });
  }

  return NextResponse.json({
    sentence: result.sentence,
    translation: result.translation,
    furigana: result.furigana,
    usedWords: chosenWords,
    cached: false,
    grammarUsed: grammar ? { pattern: grammar.pattern, meaning: grammar.meaning } : null,
    direction,
  });
}
