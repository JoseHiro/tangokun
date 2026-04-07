import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vocabularyProgress: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/progress/words/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.vocabularyProgress.findMany);

function authed(id = "user1") {
  mockAuth.mockResolvedValue({ user: { id } } as never);
}

function makeProgressRow(overrides: Partial<{
  vocabId: string;
  userId: string;
  lifetimeAttempts: number;
  lifetimeCorrect: number;
  recentSessionScores: unknown;
  lastSessionScore: number | null;
  lastSeen: Date | null;
}> = {}) {
  return {
    vocabId: "word1",
    userId: "user1",
    lifetimeAttempts: 10,
    lifetimeCorrect: 7,
    recentSessionScores: [0.6, 0.7, 0.8],
    lastSessionScore: 0.8,
    lastSeen: new Date("2026-03-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/progress/words", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when no progress records", async () => {
    authed();
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns progress summaries with mastery state", async () => {
    authed();
    mockFindMany.mockResolvedValue([makeProgressRow()] as never);
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      wordId: "word1",
      lifetimeAttempts: 10,
      lifetimeCorrect: 7,
    });
    expect(["new", "learning", "familiar", "strong", "mastered"]).toContain(data[0].mastery);
  });

  it("includes lastSeen as ISO string when present", async () => {
    authed();
    const lastSeen = new Date("2026-03-01T00:00:00Z");
    mockFindMany.mockResolvedValue([makeProgressRow({ lastSeen })] as never);
    const res = await GET();
    const data = await res.json();
    expect(data[0].lastSeen).toBe(lastSeen.toISOString());
  });

  it("sets lastSeen to null when word has never been seen", async () => {
    authed();
    mockFindMany.mockResolvedValue([makeProgressRow({ lastSeen: null })] as never);
    const res = await GET();
    const data = await res.json();
    expect(data[0].lastSeen).toBeNull();
  });

  it("assigns 'new' mastery for word with no attempts", async () => {
    authed();
    mockFindMany.mockResolvedValue([
      makeProgressRow({ lifetimeAttempts: 0, lifetimeCorrect: 0, recentSessionScores: [] }),
    ] as never);
    const res = await GET();
    const data = await res.json();
    expect(data[0].mastery).toBe("new");
  });

  it("assigns 'mastered' mastery for word with 8+ sessions and high scores", async () => {
    authed();
    mockFindMany.mockResolvedValue([
      makeProgressRow({
        lifetimeAttempts: 20,
        lifetimeCorrect: 19,
        recentSessionScores: [1, 1, 1, 0.9, 1, 1, 0.9, 1],
        lastSessionScore: 1,
      }),
    ] as never);
    const res = await GET();
    const data = await res.json();
    expect(data[0].mastery).toBe("mastered");
  });

  it("fetches progress for the authenticated user only", async () => {
    authed("user42");
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user42" } }),
    );
  });
});
