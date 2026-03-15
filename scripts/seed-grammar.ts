/**
 * Seeds the Grammar table with JLPT grammar patterns.
 *
 * Sources (in priority order):
 *   1. Live scrape from jlptgrammarlist.neocities.org
 *   2. Built-in fallback dataset (always inserted if scrape yields nothing)
 *
 * Usage:
 *   npm run seed:grammar
 */
import { PrismaClient } from "@prisma/client";
import { scrapeJlptGrammar, type ScrapedGrammar } from "./scrape-jlpt-grammar";

const prisma = new PrismaClient();

// ─── Built-in fallback grammar set ─────────────────────────────────────────

const FALLBACK: ScrapedGrammar[] = [
  // N5
  { pattern: "〜は〜です", meaning: "~ is ~", example: "これは本です。", translation: "This is a book.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜が好き", meaning: "to like ~", example: "私は音楽が好きです。", translation: "I like music.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜たい", meaning: "want to do ~", example: "水が飲みたいです。", translation: "I want to drink water.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜ている", meaning: "is doing ~ / ongoing state", example: "今、勉強しています。", translation: "I am studying now.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜ない", meaning: "do not ~", example: "今日は学校に行かない。", translation: "I don't go to school today.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜ました", meaning: "did ~ (polite past)", example: "昨日、映画を見ました。", translation: "I watched a movie yesterday.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜ましょう", meaning: "let's do ~", example: "一緒に食べましょう。", translation: "Let's eat together.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜てください", meaning: "please do ~", example: "ここに書いてください。", translation: "Please write here.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜も", meaning: "also / too", example: "私も学生です。", translation: "I am also a student.", jlptLevel: "N5", source: "built-in" },
  { pattern: "〜から", meaning: "because ~ / from ~", example: "眠いから、寝ます。", translation: "I'll sleep because I'm sleepy.", jlptLevel: "N5", source: "built-in" },
  // N4
  { pattern: "〜たことがある", meaning: "have done ~ before", example: "日本に行ったことがあります。", translation: "I have been to Japan before.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜てから", meaning: "after doing ~", example: "宿題をしてから、遊びます。", translation: "After doing homework, I'll play.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜ながら", meaning: "while doing ~", example: "音楽を聴きながら、走ります。", translation: "I run while listening to music.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜なければならない", meaning: "must do ~ / have to ~", example: "毎日薬を飲まなければならない。", translation: "I have to take medicine every day.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜てもいい", meaning: "it's okay to do ~ / may ~", example: "ここに座ってもいいですか？", translation: "May I sit here?", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜てはいけない", meaning: "must not do ~", example: "ここで写真を撮ってはいけない。", translation: "You must not take photos here.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜つもり", meaning: "intend to ~ / plan to ~", example: "来年、大学に行くつもりです。", translation: "I intend to go to university next year.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜そう", meaning: "looks like ~ / seems like ~", example: "雨が降りそうです。", translation: "It looks like it's going to rain.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜ようだ", meaning: "it seems that ~", example: "彼は疲れているようだ。", translation: "He seems to be tired.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜たら", meaning: "if/when ~ (conditional)", example: "春になったら、花見をしよう。", translation: "When spring comes, let's go flower-viewing.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜ば", meaning: "if ~ (conditional)", example: "勉強すれば、合格できる。", translation: "If you study, you can pass.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜でしょう", meaning: "probably ~ / right?", example: "明日は晴れるでしょう。", translation: "It will probably be sunny tomorrow.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜てあげる", meaning: "do ~ for someone", example: "友達に料理を作ってあげた。", translation: "I made food for my friend.", jlptLevel: "N4", source: "built-in" },
  { pattern: "〜てもらう", meaning: "have someone do ~ for me", example: "先生に説明してもらった。", translation: "I had the teacher explain it to me.", jlptLevel: "N4", source: "built-in" },
  // N3
  { pattern: "〜ために", meaning: "in order to ~ / for the purpose of ~", example: "健康のために、毎日運動する。", translation: "I exercise every day for my health.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜によって", meaning: "depending on ~ / by ~", example: "人によって意見が違う。", translation: "Opinions differ depending on the person.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜ことができる", meaning: "can do ~ / be able to ~", example: "私は日本語を話すことができます。", translation: "I can speak Japanese.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜かもしれない", meaning: "might be ~ / perhaps ~", example: "彼は来ないかもしれない。", translation: "He might not come.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜はずだ", meaning: "should be ~ / expected to ~", example: "彼女はもう着いているはずだ。", translation: "She should have arrived already.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜ことにする", meaning: "decide to ~", example: "毎日日記を書くことにした。", translation: "I decided to write a diary every day.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜ようになる", meaning: "come to do ~ / become able to ~", example: "練習して泳げるようになった。", translation: "I practiced and became able to swim.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜ばかり", meaning: "just did ~ / only ~", example: "彼は文句ばかり言う。", translation: "He only complains.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜てしまう", meaning: "end up doing ~ / do completely", example: "財布を忘れてしまった。", translation: "I ended up forgetting my wallet.", jlptLevel: "N3", source: "built-in" },
  { pattern: "〜ようにする", meaning: "try to make sure ~ / make an effort to ~", example: "早く寝るようにしています。", translation: "I try to go to bed early.", jlptLevel: "N3", source: "built-in" },
  // N2
  { pattern: "〜にもかかわらず", meaning: "despite ~ / in spite of ~", example: "雨にもかかわらず、試合は続いた。", translation: "Despite the rain, the game continued.", jlptLevel: "N2", source: "built-in" },
  { pattern: "〜に対して", meaning: "towards ~ / in contrast to ~", example: "子供に対して優しく話した。", translation: "I spoke gently to the child.", jlptLevel: "N2", source: "built-in" },
  { pattern: "〜において", meaning: "in ~ / at ~ (formal)", example: "この分野において彼は天才だ。", translation: "He is a genius in this field.", jlptLevel: "N2", source: "built-in" },
  { pattern: "〜わけだ", meaning: "it means that ~ / no wonder ~", example: "10年勉強したから、上手なわけだ。", translation: "No wonder he's good — he studied for 10 years.", jlptLevel: "N2", source: "built-in" },
  { pattern: "〜に違いない", meaning: "must be ~ / no doubt ~", example: "彼は怒っているに違いない。", translation: "He must be angry.", jlptLevel: "N2", source: "built-in" },
  // N1
  { pattern: "〜をもって", meaning: "with ~ / by means of ~ (formal)", example: "本日をもってこの店は閉店します。", translation: "This store will close as of today.", jlptLevel: "N1", source: "built-in" },
  { pattern: "〜にほかならない", meaning: "is nothing but ~ / is exactly ~", example: "これは努力の結果にほかならない。", translation: "This is nothing but the result of hard work.", jlptLevel: "N1", source: "built-in" },
];

// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[seed] Attempting live scrape...");
  const scraped = await scrapeJlptGrammar();
  const source = scraped.length > 0 ? scraped : FALLBACK;
  console.log(`[seed] Using ${source.length} grammar patterns (${scraped.length > 0 ? "scraped" : "fallback"}).`);

  // Load existing patterns to avoid duplicates
  const existing = await prisma.grammar.findMany({ select: { pattern: true } });
  const existingSet = new Set(existing.map((g: { pattern: string }) => g.pattern));

  const newGrammar = source.filter((g) => !existingSet.has(g.pattern));

  if (newGrammar.length === 0) {
    console.log("[seed] No new patterns to insert — database already up to date.");
    return;
  }

  const result = await prisma.grammar.createMany({ data: newGrammar });
  console.log(`[seed] ✓ Inserted ${result.count} grammar patterns. (${source.length - newGrammar.length} duplicates skipped)`);
}

main()
  .catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
