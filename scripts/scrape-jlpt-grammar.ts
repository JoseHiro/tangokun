/**
 * Scrapes JLPT grammar patterns from https://jlptgrammarlist.neocities.org/
 *
 * The site is organised with sections per JLPT level (N5–N1).
 * Each entry contains a pattern, English meaning, and an example sentence.
 *
 * Run directly (for inspection):
 *   npx tsx scripts/scrape-jlpt-grammar.ts
 */
import axios from "axios";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export type ScrapedGrammar = {
  pattern: string;
  meaning: string;
  example: string;
  translation: string;
  jlptLevel: string;
  source: string;
};

const BASE_URL = "https://jlptgrammarlist.neocities.org/";

export async function scrapeJlptGrammar(): Promise<ScrapedGrammar[]> {
  const results: ScrapedGrammar[] = [];

  try {
    const { data: html } = await axios.get(BASE_URL, { timeout: 15_000 });
    const $ = cheerio.load(html);

    // The site uses heading tags (h2/h3) to mark JLPT levels, followed
    // by tables or definition lists with grammar entries.
    // Strategy: walk through the DOM, track current level, collect entries.
    let currentLevel = "N5";

    // Try table-based layout
    $("h1, h2, h3, h4").each((_, el) => {
      const text = $(el).text().trim();
      const levelMatch = text.match(/N[1-5]/);
      if (levelMatch) currentLevel = levelMatch[0];
    });

    // Try rows in any table that looks like grammar data
    $("tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const pattern = cells.eq(0).text().trim();
        const meaning = cells.eq(1).text().trim();
        const example = cells.eq(2)?.text().trim() ?? "";
        const translation = cells.eq(3)?.text().trim() ?? "";

        if (pattern && meaning && pattern.length > 1) {
          // Try to infer level from nearby heading
          const levelFromRow = inferLevel($(row), $);
          results.push({
            pattern,
            meaning,
            example,
            translation,
            jlptLevel: levelFromRow ?? currentLevel,
            source: "jlptgrammarlist.neocities.org",
          });
        }
      }
    });

    // Try definition-list style (dt = pattern, dd = meaning/example)
    $("dt").each((_, dt) => {
      const pattern = $(dt).text().trim();
      const dd = $(dt).next("dd");
      const meaning = dd.text().trim();
      if (pattern && meaning) {
        results.push({
          pattern,
          meaning,
          example: "",
          translation: "",
          jlptLevel: inferLevel($(dt), $) ?? "N5",
          source: "jlptgrammarlist.neocities.org",
        });
      }
    });
  } catch (err) {
    console.warn(`[scraper] Failed to fetch ${BASE_URL}:`, (err as Error).message);
    console.warn("[scraper] Falling back to built-in grammar list.");
  }

  // Deduplicate by pattern
  const seen = new Set<string>();
  const unique = results.filter((g) => {
    if (seen.has(g.pattern)) return false;
    seen.add(g.pattern);
    return true;
  });

  console.log(`[scraper] Found ${unique.length} patterns from site.`);
  return unique;
}

/** Walk up the DOM to find the nearest preceding level heading. */
function inferLevel($el: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): string | null {
  let el: AnyNode | null | undefined = $el[0];
  while (el) {
    el = el.prev ?? undefined;
    if (!el) break;
    const text = $(el).text();
    const m = text.match(/N[1-5]/);
    if (m) return m[0];
  }
  return null;
}

// Run directly
if (process.argv[1]?.endsWith("scrape-jlpt-grammar.ts")) {
  scrapeJlptGrammar().then((data) => {
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  });
}
