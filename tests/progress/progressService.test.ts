import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Prisma mock ───────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vocabularyProgress: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    practiceLog: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { saveSessionProgress, getProgressForWords } from "@/features/progress/progressService";
import type { QuestionResult } from "@/features/progress/types";

const mockFindMany = vi.mocked(prisma.vocabularyProgress.findMany);
const mockUpsert = vi.mocked(prisma.vocabularyProgress.upsert);
const mockCreateMany = vi.mocked(prisma.practiceLog.createMany);
const mockTransaction = vi.mocked(prisma.$transaction);

// A minimal DB row shape returned by findMany
function dbRow(overrides: Partial<{
  vocabId: string; userId: string;
  lifetimeAttempts: number; lifetimeCorrect: number;
  recentSessionScores: unknown; lastSessionScore: number | null;
  lastSeen: Date | null;
}> = {}) {
  return {
    id: "prog1",
    vocabId: "w1",
    userId: "u1",
    lifetimeAttempts: 0,
    lifetimeCorrect: 0,
    recentSessionScores: [],
    lastSessionScore: null,
    lastSeen: null,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction resolves whatever promises it receives
  mockTransaction.mockImplementation((ops: unknown) =>
    Promise.all(ops as Promise<unknown>[])
  );
  mockUpsert.mockResolvedValue(dbRow() as never);
  mockCreateMany.mockResolvedValue({ count: 0 });
});

// ── saveSessionProgress ───────────────────────────────────────────────────────

describe("saveSessionProgress", () => {
  it("does nothing when results array is empty", async () => {
    await saveSessionProgress("u1", []);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("loads existing progress for affected words", async () => {
    mockFindMany.mockResolvedValue([]);
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w2", correct: false },
    ];
    await saveSessionProgress("u1", results);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1", vocabId: { in: ["w1", "w2"] } },
    });
  });

  it("upserts one record per unique word", async () => {
    mockFindMany.mockResolvedValue([]);
    // w1 appears twice — should be collapsed into one upsert
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: false },
    ];
    await saveSessionProgress("u1", results);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it("upserts separate records for different words", async () => {
    mockFindMany.mockResolvedValue([]);
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w2", correct: true },
    ];
    await saveSessionProgress("u1", results);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it("accumulates on top of existing progress", async () => {
    mockFindMany.mockResolvedValue([
      dbRow({ vocabId: "w1", userId: "u1", lifetimeAttempts: 4, lifetimeCorrect: 3 }),
    ]);
    const results: QuestionResult[] = [
      { wordId: "w1", correct: true },
      { wordId: "w1", correct: true },
    ];
    await saveSessionProgress("u1", results);

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.create.lifetimeAttempts).toBe(6); // 4 + 2
    expect(upsertCall.create.lifetimeCorrect).toBe(5);  // 3 + 2
  });

  it("wraps upserts in a transaction", async () => {
    mockFindMany.mockResolvedValue([]);
    await saveSessionProgress("u1", [{ wordId: "w1", correct: true }]);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});

// ── getProgressForWords ───────────────────────────────────────────────────────

describe("getProgressForWords", () => {
  it("queries only the given wordIds for the user", async () => {
    mockFindMany.mockResolvedValue([]);
    await getProgressForWords("u1", ["w1", "w2"]);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1", vocabId: { in: ["w1", "w2"] } },
    });
  });

  it("maps DB rows to WordProgress objects", async () => {
    mockFindMany.mockResolvedValue([
      dbRow({ vocabId: "w1", userId: "u1", lifetimeAttempts: 8, lifetimeCorrect: 6 }),
    ]);
    const results = await getProgressForWords("u1", ["w1"]);
    expect(results).toHaveLength(1);
    expect(results[0].wordId).toBe("w1");
    expect(results[0].lifetimeAttempts).toBe(8);
    expect(results[0].lifetimeCorrect).toBe(6);
  });

  it("returns empty array when no progress exists", async () => {
    mockFindMany.mockResolvedValue([]);
    const results = await getProgressForWords("u1", ["w1"]);
    expect(results).toEqual([]);
  });
});
