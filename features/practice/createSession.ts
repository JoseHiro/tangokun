import { randomUUID } from "crypto";
import { getUserVocabulary } from "@/features/vocabulary/vocabularyService";
import { getGrammarPatterns } from "@/features/grammar/grammarService";
import { buildQuestionSlots } from "@/features/practice/generateQuestions";
import { generateSentence } from "@/features/practice/sentenceGenerator";
import type { Direction, SessionQuestion, SessionResponse } from "@/types/practice";

type CreateSessionParams = {
  userId: string;
  vocabIds: string[];   // empty = use all user vocab
  grammarIds: string[]; // empty = no grammar
  direction: Direction;
};

/**
 * Orchestrates a complete practice session:
 * 1. Load vocab and grammar from the database.
 * 2. Build question slots (pure logic — each word appears exactly twice).
 * 3. Generate all sentences in parallel via OpenAI.
 * 4. Return the full session.
 */
export async function createSession({
  userId,
  vocabIds,
  grammarIds,
  direction,
}: CreateSessionParams): Promise<SessionResponse> {
  // 1. Fetch data in parallel
  const [words, grammarPatterns] = await Promise.all([
    getUserVocabulary(userId, vocabIds),
    getGrammarPatterns(grammarIds),
  ]);

  if (words.length === 0) {
    throw new Error("No vocabulary words found. Add some words first.");
  }

  // 2. Build slots (pure, no I/O)
  const slots = buildQuestionSlots(words, grammarPatterns);

  // 3. Generate sentences in parallel
  const settled = await Promise.allSettled(
    slots.map(({ word, grammar }) => generateSentence(word, grammar))
  );

  const questions: SessionQuestion[] = settled.flatMap((result, i) => {
    if (result.status !== "fulfilled" || !result.value.sentence) return [];
    const { word, grammar } = slots[i];
    return [
      {
        id: randomUUID(),
        sentence: result.value.sentence,
        translation: result.value.translation,
        furigana: result.value.furigana,
        wordUsed: word,
        grammarUsed: grammar
          ? { pattern: grammar.pattern, meaning: grammar.meaning }
          : null,
      } satisfies SessionQuestion,
    ];
  });

  return {
    sessionId: randomUUID(),
    questions,
    direction,
  };
}
