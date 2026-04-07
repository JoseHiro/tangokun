import { openai } from "@/lib/openai";
import type { VocabWord, GrammarPattern } from "@/types/practice";

export type SupportingWord = {
  word: string;
  reading: string;
  meaning: string;
};

export type GeneratedSentence = {
  sentence: string;
  translation: string;
  furigana: string;
  wordInSentence: string;
  wordReading: string;
  supportingWords: SupportingWord[];
};

const SCENARIOS = [
  "学校・大学で",
  "職場・オフィスで",
  "家族と家で",
  "週末に友達と",
  "レストランやカフェで",
  "旅行中・出張中に",
  "病院やクリニックで",
  "スポーツや運動中に",
  "買い物中に",
  "朝のルーティンで",
  "深夜に",
  "電話やビデオ通話中に",
  "駅や電車の中で",
  "公園や屋外で",
  "お祝いやパーティーで",
  "料理中や食事中に",
  "悪天候の日に",
  "コンビニで",
];

const SUBJECTS = [
  "私（一人称）",
  "友達",
  "姉",
  "弟",
  "お母さん",
  "お父さん",
  "クラスメート",
  "同僚",
  "私たち（複数）",
  "先生",
  "知らない人",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calls OpenAI to generate a single Japanese sentence for the given vocab word
 * and an optional grammar pattern.
 *
 * Separated from business logic so it can be mocked in tests.
 */
export async function generateSentence(
  word: VocabWord,
  grammar: GrammarPattern | null,
  knownWords: VocabWord[] = [],
): Promise<GeneratedSentence> {
  const scenario = pick(SCENARIOS);
  const subject = pick(SUBJECTS);

  const systemPrompt = [
    "あなたは日本語教師です。学習者のために、バリエーション豊かな練習文を一文作成してください。",
    "ルール：",
    "- 初級〜中級レベルの自然な日本語にすること。",
    "- 指定された単語を必ず文中に使うこと。",
    "- シナリオと主語は参考にするが、不自然な日本語になる場合は調整してよい。",
    "- 文法的に自然な文にすること。例えば「私は〜ましょう」のように主語と文末表現が合わない組み合わせは避けること。",
    "- ましょう・てください・ませんかなど、勧誘・依頼・提案の表現を使う場合は、主語を省略するか複数形にすること。",
    "- 最もよく使われる典型的な文（例：食べる→ご飯を食べる、読む→本を読む、寝る→毎晩寝る）は避け、文脈に合った自然な使い方をすること。",
    "- 指定単語以外に使う語彙は、「既知単語リスト」に含まれる単語か、JLPT N5レベルの極めて基本的な単語（私・今日・行く・来る・見る・大きい・小さい・好き・学校・家など）のみに限定すること。リストにない難しい単語は絶対に使わないこと。",
    grammar
      ? `- 文法パターン「${grammar.pattern}（${grammar.meaning}）」を文中で明確に使うこと。`
      : "",
    "以下のフィールドを含むJSONオブジェクトを返してください：",
    "  sentence       — 日本語の文",
    "  translation    — 自然な英語訳",
    "  furigana       — 文全体のひらがな読み",
    "  wordInSentence — 文中に実際に登場する単語の表層形（活用形のまま）。例：単語が「食べる」なら文中の「食べました」や「食べて」など",
    "  wordReading    — wordInSentence のひらがな読みのみ（文全体ではなく、その単語だけ）。例：「起きましょう」→「おきましょう」",
    "  supportingWords — 文中で使った主要な単語（指定単語を除く）の配列。最大5個。各要素は { word: 表層形, reading: ひらがな読み, meaning: 英語の意味 } の形式。",
  ]
    .filter(Boolean)
    .join("\n");

  const contextBlock = `シナリオ：${scenario}\n主語の参考：${subject}`;

  const knownWordsBlock = knownWords.length > 0
    ? `\n既知単語リスト（これらの単語は文中で使ってよい）：\n${knownWords.map((w) => `${w.jp}（${w.en}）`).join("、")}`
    : "";

  const userPrompt = grammar
    ? `単語：${word.jp}（${word.en}）\n文法：${grammar.pattern}（${grammar.meaning}）${
        grammar.example ? `\n例文：${grammar.example}` : ""
      }\n\n${contextBlock}${knownWordsBlock}`
    : `単語：${word.jp}（${word.en}）\n\n${contextBlock}${knownWordsBlock}`;

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
    wordInSentence: result.wordInSentence ?? word.jp,
    wordReading: result.wordReading ?? "",
    supportingWords: Array.isArray(result.supportingWords) ? result.supportingWords : [],
  };
}
