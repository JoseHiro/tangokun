import { openai } from "@/lib/openai";
import type { VocabWord, GrammarPattern } from "@/types/practice";

export type GeneratedSentence = {
  sentence: string;
  translation: string;
  furigana: string;
};

/**
 * Calls OpenAI to generate a single Japanese sentence for the given vocab word
 * and an optional grammar pattern.
 *
 * Separated from business logic so it can be mocked in tests.
 */
export async function generateSentence(
  word: VocabWord,
  grammar: GrammarPattern | null
): Promise<GeneratedSentence> {
  const systemPrompt = [
    "You are a Japanese language teacher.",
    "Create one simple, natural Japanese sentence using the given vocabulary word.",
    "Rules:",
    "- Beginner-to-intermediate level.",
    "- The vocabulary word must appear in the sentence.",
    grammar
      ? `- The sentence must clearly demonstrate the grammar pattern: ${grammar.pattern} (${grammar.meaning}).`
      : "",
    "Return a JSON object with exactly these fields:",
    "  sentence    — the Japanese sentence",
    "  translation — natural English translation",
    "  furigana    — full hiragana/furigana reading of the sentence",
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = grammar
    ? `Vocabulary: ${word.jp} (${word.en})\nGrammar: ${grammar.pattern} (${grammar.meaning})${
        grammar.example ? `\nExample: ${grammar.example}` : ""
      }`
    : `Vocabulary: ${word.jp} (${word.en})`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return {
    sentence: result.sentence ?? "",
    translation: result.translation ?? "",
    furigana: result.furigana ?? "",
  };
}
