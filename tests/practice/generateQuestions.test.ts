import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildQuestionSlots,
  sample,
  shuffle,
} from "@/features/practice/generateQuestions";
import type { VocabWord, GrammarPattern } from "@/types/practice";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeWords(n: number): VocabWord[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    jp: `単語${i + 1}`,
    en: `word${i + 1}`,
  }));
}

function makeGrammar(n: number): GrammarPattern[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    pattern: `〜pattern${i + 1}`,
    meaning: `meaning${i + 1}`,
    example: null,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── buildQuestionSlots ────────────────────────────────────────────────────────

describe("buildQuestionSlots", () => {
  it("each vocabulary word appears exactly twice", () => {
    const words = makeWords(5);
    const slots = buildQuestionSlots(words, []);

    for (const word of words) {
      const count = slots.filter((s) => s.word.id === word.id).length;
      expect(count, `word "${word.en}" should appear 2 times`).toBe(2);
    }
  });

  it("produces words.length × 2 questions for any word count", () => {
    expect(buildQuestionSlots(makeWords(1), [])).toHaveLength(2);
    expect(buildQuestionSlots(makeWords(5), [])).toHaveLength(10);
    expect(buildQuestionSlots(makeWords(10), [])).toHaveLength(20);
  });

  it("caps at 10 words (20 questions) even when more words are supplied", () => {
    const slots = buildQuestionSlots(makeWords(15), []);
    expect(slots).toHaveLength(20);

    // Every word that appears must appear exactly twice
    const idCounts = new Map<string, number>();
    for (const s of slots) {
      idCounts.set(s.word.id, (idCounts.get(s.word.id) ?? 0) + 1);
    }
    for (const count of idCounts.values()) {
      expect(count).toBe(2);
    }
  });

  it("slots are shuffled — repeated calls produce different orderings", () => {
    const words = makeWords(8);
    const orderStrings = new Set(
      Array.from({ length: 12 }, () =>
        buildQuestionSlots(words, []).map((s) => s.word.id).join(",")
      )
    );
    // With 16 shuffled slots the chance of all 12 runs being identical is negligible
    expect(orderStrings.size).toBeGreaterThan(1);
  });

  it("assigns no grammar when none is provided", () => {
    const slots = buildQuestionSlots(makeWords(5), []);
    expect(slots.every((s) => s.grammar === null)).toBe(true);
  });

  it("always assigns grammar when Math.random is below the threshold (0.3)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // 0.1 < 0.3 → use grammar
    const slots = buildQuestionSlots(makeWords(5), makeGrammar(2));
    expect(slots.every((s) => s.grammar !== null)).toBe(true);
  });

  it("never assigns grammar when Math.random is above the threshold (0.3)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9); // 0.9 >= 0.3 → no grammar
    const slots = buildQuestionSlots(makeWords(5), makeGrammar(2));
    expect(slots.every((s) => s.grammar === null)).toBe(true);
  });

  it("only assigns grammar patterns from the provided list", () => {
    const grammar = makeGrammar(3);
    const grammarIds = new Set(grammar.map((g) => g.id));
    const slots = buildQuestionSlots(makeWords(5), grammar);
    for (const s of slots) {
      if (s.grammar) {
        expect(grammarIds.has(s.grammar.id)).toBe(true);
      }
    }
  });
});

// ── sample ────────────────────────────────────────────────────────────────────

describe("sample", () => {
  it("returns exactly n items when n < arr.length", () => {
    expect(sample([1, 2, 3, 4, 5], 3)).toHaveLength(3);
  });

  it("returns all items when n >= arr.length", () => {
    expect(sample([1, 2, 3], 10)).toHaveLength(3);
  });

  it("returns no duplicate items", () => {
    const result = sample([1, 2, 3, 4, 5, 6, 7, 8], 6);
    expect(new Set(result).size).toBe(result.length);
  });

  it("only returns items from the source array", () => {
    const arr = [10, 20, 30, 40, 50];
    const result = sample(arr, 4);
    for (const item of result) {
      expect(arr).toContain(item);
    }
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    sample(arr, 3);
    expect(arr).toEqual(copy);
  });
});

// ── shuffle ───────────────────────────────────────────────────────────────────

describe("shuffle", () => {
  it("preserves all elements (same multiset)", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
  });

  it("returns a new array — does not mutate the original", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    const result = shuffle(arr);
    expect(arr).toEqual(copy);
    expect(result).not.toBe(arr);
  });

  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it("produces different orderings across multiple runs", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const orders = new Set(
      Array.from({ length: 10 }, () => shuffle(arr).join(","))
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});
