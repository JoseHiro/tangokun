import { describe, it, expect } from "vitest";
import {
  aggregateSession,
  updateWordProgress,
  getMastery,
  getLifetimeAccuracy,
} from "@/features/progress/aggregation";
import type { WordProgress, QuestionResult } from "@/features/progress/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProgress(overrides: Partial<WordProgress> = {}): WordProgress {
  return {
    wordId: "w1",
    userId: "u1",
    lifetimeAttempts: 0,
    lifetimeCorrect: 0,
    recentSessionScores: [],
    lastSessionScore: null,
    lastSeen: null,
    ...overrides,
  };
}

// ── aggregateSession ──────────────────────────────────────────────────────────

describe("aggregateSession", () => {
  it("returns empty array for no results", () => {
    expect(aggregateSession([])).toEqual([]);
  });

  it("groups results by wordId", () => {
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: false },
      { wordId: "w2", correct: true },
    ];
    const stats = aggregateSession(results);
    expect(stats).toHaveLength(2);

    const w1 = stats.find((s) => s.wordId === "w1")!;
    expect(w1.attempts).toBe(2);
    expect(w1.correct).toBe(1);
    expect(w1.score).toBe(0.5);

    const w2 = stats.find((s) => s.wordId === "w2")!;
    expect(w2.attempts).toBe(1);
    expect(w2.correct).toBe(1);
    expect(w2.score).toBe(1);
  });

  it("computes score as correct / attempts", () => {
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: false },
      { wordId: "w1", correct: false },
    ];
    const [stat] = aggregateSession(results);
    expect(stat.score).toBe(0.5);
  });

  it("score is 1 when all correct", () => {
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: true },
    ];
    const [stat] = aggregateSession(results);
    expect(stat.score).toBe(1);
  });

  it("score is 0 when all wrong", () => {
    const results: QuestionResult[] = [
      { wordId: "w1", correct: false },
      { wordId: "w1", correct: false },
    ];
    const [stat] = aggregateSession(results);
    expect(stat.score).toBe(0);
  });

  it("handles many unique words", () => {
    const results: QuestionResult[] = Array.from({ length: 10 }, (_, i) => ({
      wordId: `w${i}`,
      correct: i % 2 === 0,
    }));
    const stats = aggregateSession(results);
    expect(stats).toHaveLength(10);
    stats.forEach((s) => expect(s.attempts).toBe(1));
  });
});

// ── updateWordProgress ────────────────────────────────────────────────────────

describe("updateWordProgress", () => {
  const now = new Date("2026-03-16T00:00:00Z");
  const stats = { wordId: "w1", attempts: 2, correct: 1, score: 0.5 };

  it("creates new progress when existing is null", () => {
    const result = updateWordProgress(null, "w1", "u1", stats, now);
    expect(result.wordId).toBe("w1");
    expect(result.userId).toBe("u1");
    expect(result.lifetimeAttempts).toBe(2);
    expect(result.lifetimeCorrect).toBe(1);
    expect(result.lastSessionScore).toBe(0.5);
    expect(result.lastSeen).toBe(now);
    expect(result.recentSessionScores).toEqual([0.5]);
  });

  it("adds to existing lifetime counts", () => {
    const existing = makeProgress({ lifetimeAttempts: 10, lifetimeCorrect: 8 });
    const result = updateWordProgress(existing, "w1", "u1", stats, now);
    expect(result.lifetimeAttempts).toBe(12);
    expect(result.lifetimeCorrect).toBe(9);
  });

  it("appends score to recentSessionScores", () => {
    const existing = makeProgress({ recentSessionScores: [0.8, 0.9] });
    const result = updateWordProgress(existing, "w1", "u1", stats, now);
    expect(result.recentSessionScores).toEqual([0.8, 0.9, 0.5]);
  });

  it("caps recentSessionScores at 10", () => {
    const existing = makeProgress({
      recentSessionScores: Array(10).fill(1.0),
    });
    const result = updateWordProgress(existing, "w1", "u1", stats, now);
    expect(result.recentSessionScores).toHaveLength(10);
    expect(result.recentSessionScores[9]).toBe(0.5);
    expect(result.recentSessionScores[0]).toBe(1.0);
  });

  it("is a pure function — does not mutate input", () => {
    const existing = makeProgress({ recentSessionScores: [0.5] });
    const originalScores = [...existing.recentSessionScores];
    updateWordProgress(existing, "w1", "u1", stats, now);
    expect(existing.recentSessionScores).toEqual(originalScores);
  });

  it("updates lastSessionScore and lastSeen", () => {
    const existing = makeProgress({ lastSessionScore: 0.2, lastSeen: new Date(0) });
    const result = updateWordProgress(existing, "w1", "u1", stats, now);
    expect(result.lastSessionScore).toBe(0.5);
    expect(result.lastSeen).toBe(now);
  });
});

// ── getMastery ────────────────────────────────────────────────────────────────

describe("getMastery", () => {
  it("returns 'new' when no sessions", () => {
    expect(getMastery(makeProgress())).toBe("new");
  });

  it("returns 'learning' after 1 session even with a perfect score", () => {
    const p = makeProgress({ recentSessionScores: [1.0] });
    expect(getMastery(p)).toBe("learning");
  });

  it("returns 'learning' after 2 sessions even with perfect scores", () => {
    const p = makeProgress({ recentSessionScores: [1.0, 1.0] });
    expect(getMastery(p)).toBe("learning");
  });

  it("returns 'learning' after 3 sessions when avg < 0.6", () => {
    const p = makeProgress({ recentSessionScores: [0.3, 0.4, 0.5] });
    expect(getMastery(p)).toBe("learning");
  });

  it("returns 'familiar' after 3 sessions with avg >= 0.6", () => {
    const p = makeProgress({ recentSessionScores: [0.6, 0.7, 0.8] });
    expect(getMastery(p)).toBe("familiar");
  });

  it("returns 'familiar' (not strong) after 4 sessions with avg >= 0.8", () => {
    const p = makeProgress({ recentSessionScores: [0.8, 0.9, 0.85, 0.9] });
    expect(getMastery(p)).toBe("familiar");
  });

  it("returns 'strong' after 5 sessions with avg >= 0.8", () => {
    const p = makeProgress({ recentSessionScores: [0.8, 0.85, 0.9, 0.8, 0.85] });
    expect(getMastery(p)).toBe("strong");
  });

  it("returns 'strong' (not mastered) after 7 sessions with avg >= 0.9", () => {
    const p = makeProgress({ recentSessionScores: [1, 1, 0.9, 1, 1, 0.9, 1] });
    expect(getMastery(p)).toBe("strong");
  });

  it("returns 'mastered' after 8 sessions with avg >= 0.9", () => {
    const p = makeProgress({ recentSessionScores: [1, 1, 0.9, 1, 1, 0.9, 1, 1] });
    expect(getMastery(p)).toBe("mastered");
  });

  it("returns 'learning' after 5 sessions with avg < 0.6", () => {
    const p = makeProgress({ recentSessionScores: [0.3, 0.4, 0.5, 0.2, 0.4] });
    expect(getMastery(p)).toBe("learning");
  });
});

// ── getLifetimeAccuracy ───────────────────────────────────────────────────────

describe("getLifetimeAccuracy", () => {
  it("returns null when never attempted", () => {
    expect(getLifetimeAccuracy(makeProgress())).toBeNull();
  });

  it("returns correct / attempts", () => {
    const p = makeProgress({ lifetimeAttempts: 10, lifetimeCorrect: 7 });
    expect(getLifetimeAccuracy(p)).toBe(0.7);
  });

  it("returns 1 when all correct", () => {
    const p = makeProgress({ lifetimeAttempts: 5, lifetimeCorrect: 5 });
    expect(getLifetimeAccuracy(p)).toBe(1);
  });

  it("returns 0 when all wrong", () => {
    const p = makeProgress({ lifetimeAttempts: 5, lifetimeCorrect: 0 });
    expect(getLifetimeAccuracy(p)).toBe(0);
  });
});
