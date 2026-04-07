export type Direction = "jp-to-en" | "en-to-jp";
export type Phase = "setup" | "loading" | "practicing" | "finished";
export type InputMode = "voice" | "text";
export type LoadingStep = "questions" | "audio";

export type VocabWord = { id: string; jp: string; en: string };

export type GrammarItem = {
  id: string;
  pattern: string;
  meaning: string;
  jlptLevel: string | null;
  source: string | null;
};

export type SupportingWord = {
  word: string;
  reading: string;
  meaning: string;
};

export type SessionQuestion = {
  id: string;
  sentence: string;
  translation: string;
  furigana: string;
  wordInSentence: string;
  supportingWords: SupportingWord[];
  wordUsed: VocabWord;
  grammarUsed: { pattern: string; meaning: string } | null;
};

export type QuestionResult = {
  answer: string;
  correct: boolean;
  feedback: string;
  correctTranslation: string;
};
