/**
 * Seeds the Grammar table with Genki I & II grammar patterns.
 *
 * For patterns already in the database (e.g. from built-in JLPT seed),
 * this script updates their source to the corresponding Genki lesson so
 * they appear in the "By Genki Chapter" tab in the practice UI.
 *
 * Usage:
 *   npm run seed:genki-grammar
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GenkiGrammar {
  pattern: string;
  meaning: string;
  example: string;
  translation: string;
  jlptLevel: string;
  source: string;
}

// ─── Genki I & II grammar patterns ─────────────────────────────────────────

const GENKI_GRAMMAR: GenkiGrammar[] = [
  // ── Genki I - Lesson 1 ───────────────────────────────────────────────────
  { pattern: "〜は〜です", meaning: "~ is ~", example: "田中さんは学生です。", translation: "Ms. Tanaka is a student.", jlptLevel: "N5", source: "Genki I - Lesson 1" },
  { pattern: "〜ですか", meaning: "is it ~? (question marker)", example: "日本人ですか。", translation: "Are you Japanese?", jlptLevel: "N5", source: "Genki I - Lesson 1" },
  { pattern: "〜の〜", meaning: "~'s ~ (possession / noun modifier)", example: "これは私の本です。", translation: "This is my book.", jlptLevel: "N5", source: "Genki I - Lesson 1" },
  { pattern: "〜も", meaning: "also / too", example: "私も学生です。", translation: "I am also a student.", jlptLevel: "N5", source: "Genki I - Lesson 1" },

  // ── Genki I - Lesson 2 ───────────────────────────────────────────────────
  { pattern: "これ/それ/あれ/どれ", meaning: "this / that / that over there / which", example: "これはいくらですか。", translation: "How much is this?", jlptLevel: "N5", source: "Genki I - Lesson 2" },
  { pattern: "この/その/あの/どの", meaning: "this ~ / that ~ / that ~ over there / which ~", example: "このかばんは私のです。", translation: "This bag is mine.", jlptLevel: "N5", source: "Genki I - Lesson 2" },
  { pattern: "ここ/そこ/あそこ/どこ", meaning: "here / there / over there / where", example: "トイレはどこですか。", translation: "Where is the bathroom?", jlptLevel: "N5", source: "Genki I - Lesson 2" },
  { pattern: "だれの〜", meaning: "whose ~", example: "これはだれのかさですか。", translation: "Whose umbrella is this?", jlptLevel: "N5", source: "Genki I - Lesson 2" },
  { pattern: "〜も〜ない", meaning: "~ not ~ either (negative も)", example: "私もわかりません。", translation: "I don't understand either.", jlptLevel: "N5", source: "Genki I - Lesson 2" },

  // ── Genki I - Lesson 3 ───────────────────────────────────────────────────
  { pattern: "〜ます", meaning: "polite non-past verb form", example: "毎日日本語を勉強します。", translation: "I study Japanese every day.", jlptLevel: "N5", source: "Genki I - Lesson 3" },
  { pattern: "〜を", meaning: "direct object particle", example: "コーヒーを飲みます。", translation: "I drink coffee.", jlptLevel: "N5", source: "Genki I - Lesson 3" },
  { pattern: "〜で（手段・場所）", meaning: "at (place of action) / by (means of)", example: "図書館で本を読みます。", translation: "I read books at the library.", jlptLevel: "N5", source: "Genki I - Lesson 3" },
  { pattern: "〜に/〜へ（方向）", meaning: "to (destination / direction)", example: "学校に行きます。", translation: "I go to school.", jlptLevel: "N5", source: "Genki I - Lesson 3" },
  { pattern: "時間に", meaning: "at (specific time)", example: "七時に起きます。", translation: "I wake up at seven o'clock.", jlptLevel: "N5", source: "Genki I - Lesson 3" },
  { pattern: "よく/ときどき/あまり/全然", meaning: "frequency adverbs (often / sometimes / not much / not at all)", example: "私はよく映画を見ます。", translation: "I often watch movies.", jlptLevel: "N5", source: "Genki I - Lesson 3" },

  // ── Genki I - Lesson 4 ───────────────────────────────────────────────────
  { pattern: "い形容詞", meaning: "i-adjective (ends in い)", example: "この映画はおもしろいです。", translation: "This movie is interesting.", jlptLevel: "N5", source: "Genki I - Lesson 4" },
  { pattern: "な形容詞", meaning: "na-adjective (requires な before noun)", example: "ここは静かな公園です。", translation: "This is a quiet park.", jlptLevel: "N5", source: "Genki I - Lesson 4" },
  { pattern: "〜が好き/嫌い", meaning: "like / dislike ~", example: "私は音楽が好きです。", translation: "I like music.", jlptLevel: "N5", source: "Genki I - Lesson 4" },
  { pattern: "〜が上手/下手", meaning: "be good at / bad at ~", example: "姉は料理が上手です。", translation: "My older sister is good at cooking.", jlptLevel: "N5", source: "Genki I - Lesson 4" },
  { pattern: "〜ましょう", meaning: "let's do ~", example: "一緒に食べましょう。", translation: "Let's eat together.", jlptLevel: "N5", source: "Genki I - Lesson 4" },
  { pattern: "〜ましょうか", meaning: "shall we ~ / shall I ~?", example: "窓を開けましょうか。", translation: "Shall I open the window?", jlptLevel: "N5", source: "Genki I - Lesson 4" },

  // ── Genki I - Lesson 5 ───────────────────────────────────────────────────
  { pattern: "〜に行く/来る", meaning: "go / come to (place)", example: "デパートに行きます。", translation: "I'm going to the department store.", jlptLevel: "N5", source: "Genki I - Lesson 5" },
  { pattern: "〜しに行く", meaning: "go to do ~ (purpose)", example: "本を買いに図書館に行きます。", translation: "I go to the library to buy books.", jlptLevel: "N5", source: "Genki I - Lesson 5" },
  { pattern: "〜ませんか", meaning: "won't you do ~? (invitation)", example: "一緒に映画を見ませんか。", translation: "Won't you watch a movie with me?", jlptLevel: "N5", source: "Genki I - Lesson 5" },

  // ── Genki I - Lesson 6 ───────────────────────────────────────────────────
  { pattern: "〜てください", meaning: "please do ~", example: "ここに書いてください。", translation: "Please write here.", jlptLevel: "N5", source: "Genki I - Lesson 6" },
  { pattern: "〜てもいい", meaning: "it's okay to ~ / may ~", example: "ここに座ってもいいですか？", translation: "May I sit here?", jlptLevel: "N4", source: "Genki I - Lesson 6" },
  { pattern: "〜てはいけない", meaning: "must not do ~", example: "ここで写真を撮ってはいけない。", translation: "You must not take photos here.", jlptLevel: "N4", source: "Genki I - Lesson 6" },
  { pattern: "〜から（理由）", meaning: "because ~ / so ~ (stating reason)", example: "眠いから、寝ます。", translation: "I'll sleep because I'm sleepy.", jlptLevel: "N5", source: "Genki I - Lesson 6" },

  // ── Genki I - Lesson 7 ───────────────────────────────────────────────────
  { pattern: "〜ている", meaning: "is doing ~ / ongoing state", example: "今、勉強しています。", translation: "I am studying now.", jlptLevel: "N5", source: "Genki I - Lesson 7" },
  { pattern: "家族の言い方", meaning: "family member terms (in-group vs. out-group forms)", example: "これは私の母です。", translation: "This is my mother.", jlptLevel: "N5", source: "Genki I - Lesson 7" },
  { pattern: "〜にいる/ある", meaning: "~ is/exists at (location)", example: "猫はソファの上にいます。", translation: "The cat is on the sofa.", jlptLevel: "N5", source: "Genki I - Lesson 7" },

  // ── Genki I - Lesson 8 ───────────────────────────────────────────────────
  { pattern: "普通形（辞書形・ない形）", meaning: "plain form (dictionary / negative)", example: "毎日運動する。", translation: "I exercise every day. (plain)", jlptLevel: "N5", source: "Genki I - Lesson 8" },
  { pattern: "〜と思う", meaning: "I think that ~", example: "明日は晴れると思います。", translation: "I think it will be sunny tomorrow.", jlptLevel: "N4", source: "Genki I - Lesson 8" },
  { pattern: "〜と言っていました", meaning: "(someone) said that ~", example: "先生は明日テストだと言っていました。", translation: "The teacher said there will be a test tomorrow.", jlptLevel: "N4", source: "Genki I - Lesson 8" },
  { pattern: "〜ないでください", meaning: "please don't do ~", example: "ここで走らないでください。", translation: "Please don't run here.", jlptLevel: "N5", source: "Genki I - Lesson 8" },

  // ── Genki I - Lesson 9 ───────────────────────────────────────────────────
  { pattern: "〜た（過去形）", meaning: "past tense (plain form)", example: "昨日、友達と話した。", translation: "I talked with a friend yesterday.", jlptLevel: "N5", source: "Genki I - Lesson 9" },
  { pattern: "〜たり〜たりする", meaning: "do things like ~ and ~", example: "週末は映画を見たり、本を読んだりします。", translation: "On weekends I do things like watch movies and read books.", jlptLevel: "N4", source: "Genki I - Lesson 9" },
  { pattern: "〜たことがある", meaning: "have done ~ before (experience)", example: "日本に行ったことがあります。", translation: "I have been to Japan before.", jlptLevel: "N4", source: "Genki I - Lesson 9" },
  { pattern: "〜んです", meaning: "explanatory / seeking explanation (んです)", example: "どうしたんですか。", translation: "What's the matter? (seeking explanation)", jlptLevel: "N4", source: "Genki I - Lesson 9" },

  // ── Genki I - Lesson 10 ──────────────────────────────────────────────────
  { pattern: "〜より〜のほうが", meaning: "~ is more ~ than ~", example: "バスより電車のほうが速いです。", translation: "The train is faster than the bus.", jlptLevel: "N4", source: "Genki I - Lesson 10" },
  { pattern: "〜つもり", meaning: "intend to ~ / plan to ~", example: "来年、大学に行くつもりです。", translation: "I intend to go to university next year.", jlptLevel: "N4", source: "Genki I - Lesson 10" },
  { pattern: "〜くなる/〜になる", meaning: "become ~ (change of state)", example: "だんだん暖かくなりました。", translation: "It has gradually become warm.", jlptLevel: "N4", source: "Genki I - Lesson 10" },
  { pattern: "どちら", meaning: "which (of two) / which way", example: "コーヒーと紅茶、どちらがいいですか。", translation: "Which do you prefer, coffee or tea?", jlptLevel: "N5", source: "Genki I - Lesson 10" },

  // ── Genki I - Lesson 11 ──────────────────────────────────────────────────
  { pattern: "数量表現（〜つ/〜本/〜枚など）", meaning: "quantity expressions (counters)", example: "りんごを三つ買いました。", translation: "I bought three apples.", jlptLevel: "N5", source: "Genki I - Lesson 11" },
  { pattern: "〜だけ", meaning: "only ~ / just ~", example: "一つだけください。", translation: "Just one, please.", jlptLevel: "N4", source: "Genki I - Lesson 11" },
  { pattern: "〜しか〜ない", meaning: "only ~ (with negative verb)", example: "百円しかありません。", translation: "I only have 100 yen.", jlptLevel: "N4", source: "Genki I - Lesson 11" },
  { pattern: "〜前に", meaning: "before doing ~ / before ~", example: "寝る前に歯を磨きます。", translation: "I brush my teeth before sleeping.", jlptLevel: "N4", source: "Genki I - Lesson 11" },
  { pattern: "〜てから", meaning: "after doing ~", example: "宿題をしてから、遊びます。", translation: "After doing homework, I'll play.", jlptLevel: "N4", source: "Genki I - Lesson 11" },

  // ── Genki I - Lesson 12 ──────────────────────────────────────────────────
  { pattern: "〜すぎる", meaning: "too ~ / excessively ~", example: "この映画は長すぎます。", translation: "This movie is too long.", jlptLevel: "N4", source: "Genki I - Lesson 12" },
  { pattern: "〜ほうがいい", meaning: "had better ~ / should ~", example: "早く寝たほうがいいですよ。", translation: "You should go to bed early.", jlptLevel: "N4", source: "Genki I - Lesson 12" },
  { pattern: "〜ので", meaning: "because ~ / since ~ (reason, softer)", example: "具合が悪いので、休みます。", translation: "I'll rest because I'm not feeling well.", jlptLevel: "N4", source: "Genki I - Lesson 12" },

  // ── Genki II - Lesson 13 ─────────────────────────────────────────────────
  { pattern: "〜たい", meaning: "want to do ~", example: "水が飲みたいです。", translation: "I want to drink water.", jlptLevel: "N5", source: "Genki II - Lesson 13" },
  { pattern: "〜たがる", meaning: "seems to want to ~ / (someone) wants to ~", example: "弟はゲームをしたがっています。", translation: "My younger brother seems to want to play games.", jlptLevel: "N4", source: "Genki II - Lesson 13" },
  { pattern: "〜ほしい", meaning: "want (something) / wish for ~", example: "新しいパソコンがほしいです。", translation: "I want a new computer.", jlptLevel: "N4", source: "Genki II - Lesson 13" },

  // ── Genki II - Lesson 14 ─────────────────────────────────────────────────
  { pattern: "〜（ら）れる（可能）", meaning: "can do ~ / be able to ~ (potential form)", example: "私は漢字が読めます。", translation: "I can read kanji.", jlptLevel: "N4", source: "Genki II - Lesson 14" },
  { pattern: "〜し", meaning: "and moreover ~ / listing reasons", example: "この店は安いし、おいしいし、また来たいです。", translation: "This restaurant is cheap and delicious — I want to come again.", jlptLevel: "N4", source: "Genki II - Lesson 14" },
  { pattern: "〜そう（様子）", meaning: "looks like ~ / seems like ~ (from appearance)", example: "雨が降りそうです。", translation: "It looks like it's going to rain.", jlptLevel: "N4", source: "Genki II - Lesson 14" },

  // ── Genki II - Lesson 15 ─────────────────────────────────────────────────
  { pattern: "あげる/くれる/もらう", meaning: "give (outward) / give (to me) / receive", example: "友達にプレゼントをあげました。", translation: "I gave a present to my friend.", jlptLevel: "N4", source: "Genki II - Lesson 15" },
  { pattern: "〜てあげる", meaning: "do ~ for someone", example: "友達に料理を作ってあげた。", translation: "I made food for my friend.", jlptLevel: "N4", source: "Genki II - Lesson 15" },
  { pattern: "〜てくれる", meaning: "someone does ~ for me / my benefit", example: "友達が手伝ってくれました。", translation: "My friend helped me.", jlptLevel: "N4", source: "Genki II - Lesson 15" },
  { pattern: "〜てもらう", meaning: "have someone do ~ for me", example: "先生に説明してもらった。", translation: "I had the teacher explain it to me.", jlptLevel: "N4", source: "Genki II - Lesson 15" },

  // ── Genki II - Lesson 16 ─────────────────────────────────────────────────
  { pattern: "〜てしまう", meaning: "end up doing ~ / do completely (often with regret)", example: "財布を忘れてしまった。", translation: "I ended up forgetting my wallet.", jlptLevel: "N3", source: "Genki II - Lesson 16" },
  { pattern: "〜といい", meaning: "I hope ~ / it would be nice if ~", example: "早く良くなるといいですね。", translation: "I hope you get better soon.", jlptLevel: "N4", source: "Genki II - Lesson 16" },
  { pattern: "〜時", meaning: "when ~ / at the time of ~", example: "子供の時、よく公園で遊びました。", translation: "When I was a child, I often played at the park.", jlptLevel: "N4", source: "Genki II - Lesson 16" },
  { pattern: "〜ながら", meaning: "while doing ~ (simultaneous actions)", example: "音楽を聴きながら、走ります。", translation: "I run while listening to music.", jlptLevel: "N4", source: "Genki II - Lesson 16" },

  // ── Genki II - Lesson 17 ─────────────────────────────────────────────────
  { pattern: "〜ば", meaning: "if ~ (provisional conditional)", example: "勉強すれば、合格できる。", translation: "If you study, you can pass.", jlptLevel: "N4", source: "Genki II - Lesson 17" },
  { pattern: "〜なら", meaning: "if ~ / given that ~ (conditional, topic-based)", example: "日本に行くなら、京都もお勧めです。", translation: "If you're going to Japan, Kyoto is also recommended.", jlptLevel: "N4", source: "Genki II - Lesson 17" },
  { pattern: "〜でも", meaning: "even ~ / or something (suggestion / concession)", example: "お茶でも飲みませんか。", translation: "Won't you have some tea or something?", jlptLevel: "N3", source: "Genki II - Lesson 17" },

  // ── Genki II - Lesson 18 ─────────────────────────────────────────────────
  { pattern: "自動詞/他動詞", meaning: "intransitive vs. transitive verb pairs", example: "ドアが開いた。／ドアを開けた。", translation: "The door opened. / I opened the door.", jlptLevel: "N3", source: "Genki II - Lesson 18" },
  { pattern: "〜てある", meaning: "has been done (resultant state, intentional)", example: "黒板に予定が書いてあります。", translation: "The schedule has been written on the blackboard.", jlptLevel: "N4", source: "Genki II - Lesson 18" },
  { pattern: "〜間に", meaning: "while ~ / during ~ (something happens within a period)", example: "私が寝ている間に、電話があった。", translation: "While I was sleeping, there was a phone call.", jlptLevel: "N3", source: "Genki II - Lesson 18" },

  // ── Genki II - Lesson 19 ─────────────────────────────────────────────────
  { pattern: "お〜になる", meaning: "honorific form of verbs (respectful speech)", example: "先生はもうお帰りになりましたか。", translation: "Has the teacher already gone home?", jlptLevel: "N3", source: "Genki II - Lesson 19" },
  { pattern: "お〜する/いたす", meaning: "humble form of verbs (modest speech)", example: "ご案内いたします。", translation: "I will show you the way.", jlptLevel: "N3", source: "Genki II - Lesson 19" },

  // ── Genki II - Lesson 20 ─────────────────────────────────────────────────
  { pattern: "〜（ら）れる（受身）", meaning: "passive form (~ is done / ~ gets done)", example: "その映画は多くの人に見られています。", translation: "That movie is being watched by many people.", jlptLevel: "N3", source: "Genki II - Lesson 20" },
  { pattern: "迷惑の受身", meaning: "adversative passive (put-upon passive — subject is negatively affected)", example: "雨に降られて、かばんが濡れた。", translation: "I got my bag wet because it rained on me.", jlptLevel: "N3", source: "Genki II - Lesson 20" },

  // ── Genki II - Lesson 21 ─────────────────────────────────────────────────
  { pattern: "〜（さ）せる", meaning: "causative form (make / let someone do ~)", example: "先生は学生に作文を書かせた。", translation: "The teacher made the students write a composition.", jlptLevel: "N3", source: "Genki II - Lesson 21" },
  { pattern: "〜ていただけませんか", meaning: "could you please ~ (polite request)", example: "もう一度説明していただけませんか。", translation: "Could you please explain once more?", jlptLevel: "N3", source: "Genki II - Lesson 21" },

  // ── Genki II - Lesson 22 ─────────────────────────────────────────────────
  { pattern: "〜（さ）せられる", meaning: "causative-passive (be made to do ~ against one's will)", example: "毎日残業させられています。", translation: "I am made to do overtime every day.", jlptLevel: "N2", source: "Genki II - Lesson 22" },
  { pattern: "〜ばよかった", meaning: "I should have done ~ / I wish I had ~", example: "もっと早く起きればよかった。", translation: "I should have woken up earlier.", jlptLevel: "N3", source: "Genki II - Lesson 22" },
  { pattern: "〜のに（後悔・不満）", meaning: "even though ~ (expressing regret or frustration)", example: "あんなに練習したのに、負けてしまった。", translation: "Even though I practiced so much, I ended up losing.", jlptLevel: "N3", source: "Genki II - Lesson 22" },

  // ── Genki II - Lesson 23 ─────────────────────────────────────────────────
  { pattern: "〜ことにする", meaning: "decide to ~ (speaker's decision)", example: "毎日日記を書くことにした。", translation: "I decided to write a diary every day.", jlptLevel: "N3", source: "Genki II - Lesson 23" },
  { pattern: "〜ことになる", meaning: "it has been decided that ~ (circumstantial / external decision)", example: "来月、大阪に転勤することになりました。", translation: "It has been decided that I'll transfer to Osaka next month.", jlptLevel: "N3", source: "Genki II - Lesson 23" },
  { pattern: "〜までに", meaning: "by ~ (deadline)", example: "金曜日までにレポートを出してください。", translation: "Please submit your report by Friday.", jlptLevel: "N3", source: "Genki II - Lesson 23" },
  { pattern: "〜ても", meaning: "even if ~ / even though ~ (concessive)", example: "雨が降っても、試合はあります。", translation: "Even if it rains, the game will be held.", jlptLevel: "N3", source: "Genki II - Lesson 23" },
];

// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[seed] Processing ${GENKI_GRAMMAR.length} Genki grammar patterns...`);

  let inserted = 0;
  let updated = 0;

  for (const item of GENKI_GRAMMAR) {
    const existing = await prisma.grammar.findFirst({ where: { pattern: item.pattern } });

    if (existing) {
      await prisma.grammar.update({
        where: { id: existing.id },
        data: { source: item.source },
      });
      updated++;
    } else {
      await prisma.grammar.create({ data: item });
      inserted++;
    }
  }

  console.log(`[seed] ✓ Done. Inserted: ${inserted}, Updated: ${updated}.`);
}

main()
  .catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
