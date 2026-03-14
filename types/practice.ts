export type Direction = "jp-to-en" | "en-to-jp";

export type VocabWord = {
  id: string;
  jp: string;
  en: string;
};

export type GrammarPattern = {
  id: string;
  pattern: string;
  meaning: string;
  example: string | null;
};

export type QuestionSlot = {
  word: VocabWord;
  grammar: GrammarPattern | null;
};

export type SessionQuestion = {
  id: string;
  sentence: string;
  translation: string;
  furigana: string;
  wordUsed: VocabWord;
  grammarUsed: { pattern: string; meaning: string } | null;
};

export type SessionResponse = {
  sessionId: string;
  questions: SessionQuestion[];
  direction: Direction;
};
