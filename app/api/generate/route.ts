import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { auth } from "@/auth";

export type UsedWord = { id: string; jp: string; en: string };
export type Direction = "jp-to-en" | "en-to-jp";

const SCENARIOS = [
  "at school or university",
  "at work or the office",
  "at home with family",
  "with friends on the weekend",
  "at a restaurant or café",
  "while traveling or on a trip",
  "at a hospital or clinic",
  "during a sports event or exercise",
  "while shopping",
  "in the morning routine",
  "late at night",
  "during a phone or video call",
  "at a station or on a train",
  "at a park or outdoors",
  "during a celebration or party",
  "while cooking or eating",
  "during bad weather",
  "at a convenience store",
];

const SUBJECTS = [
  "I (私)",
  "my friend (友達)",
  "my older sister (姉)",
  "my younger brother (弟)",
  "my mother (お母さん)",
  "my father (お父さん)",
  "a classmate (クラスメート)",
  "a colleague (同僚)",
  "we (私たち)",
  "the teacher (先生)",
  "a stranger (知らない人)",
];

const STRUCTURES = [
  "simple present or past",
  "with a reason or because-clause (〜から・〜ので)",
  "with a time expression (e.g. yesterday, last week, every morning)",
  "as a question",
  "expressing desire or intention (〜たい・〜つもり)",
  "expressing possibility or uncertainty (〜かもしれない・〜と思う)",
  "in casual/plain speech style",
  "in polite/ます speech style",
  "with a contrast or concession (〜けど・〜が)",
  "expressing a request or suggestion (〜てください・〜ましょう)",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomContext(): string {
  return `Scenario: ${pick(SCENARIOS)}\nSubject: ${pick(SUBJECTS)}\nSentence structure: ${pick(STRUCTURES)}`;
}

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
  console.log("vocabIds", vocabIds);
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
        type VocabRow = { id: string; jp: string; en: string };
        const idMap = new Map<string, string>(
          (dbWords as VocabRow[]).map((w) => [w.jp, w.id])
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
${grammar!.example ? `Example usage: ${grammar!.example}` : ""}

${randomContext()}`,
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
  const chosenWords = sample<UsedWord>(allWords, wordCount);
  const vocabList = chosenWords.map((w) => `${w.jp} (${w.en})`).join("\n");
  const context = randomContext();

  let systemPrompt: string;
  let userPrompt: string;

  if (hasGrammar) {
    systemPrompt = `You are a Japanese language teacher creating varied practice sentences.
Create a natural Japanese sentence that uses BOTH the grammar pattern AND the vocabulary words.
Rules:
- Must clearly demonstrate the grammar pattern.
- Use as many vocabulary words as possible.
- Follow the scenario, subject, and sentence structure exactly — these are chosen to ensure variety across sessions.
- Beginner-to-intermediate level.
Return a JSON object with exactly these fields:
  sentence    — the Japanese sentence
  translation — natural English translation
  furigana    — full hiragana/furigana reading of the sentence`;
    userPrompt = `Grammar pattern: ${grammar!.pattern} (${grammar!.meaning})
${grammar!.example ? `Example usage: ${grammar!.example}` : ""}

Vocabulary:\n${vocabList}

${context}`;
  } else {
    systemPrompt = `You are a Japanese language teacher creating varied practice sentences.
Create a natural Japanese sentence using the vocabulary words provided.
Rules:
- Use as many of the listed words as possible.
- Strictly follow the scenario, subject, and sentence structure provided — do NOT default to the most common or stereotypical usage of the word.
- Avoid the most predictable object or context for the given verb (e.g. don't always use 本 for 読む, don't always use ご飯 for 食べる).
- Beginner-to-intermediate level.
- Add grammar particles and helper verbs as needed.
Return a JSON object with exactly these fields:
  sentence    — the Japanese sentence
  translation — natural English translation
  furigana    — full hiragana/furigana reading of the sentence`;
    userPrompt = `Vocabulary:\n${vocabList}\n\n${context}`;
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
