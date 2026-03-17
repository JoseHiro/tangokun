import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vocabulary: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST, DELETE } from "@/app/api/vocab/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.vocabulary.findMany);
const mockFindFirst = vi.mocked(prisma.vocabulary.findFirst);
const mockCreate = vi.mocked(prisma.vocabulary.create);
const mockFindUnique = vi.mocked(prisma.vocabulary.findUnique);
const mockDelete = vi.mocked(prisma.vocabulary.delete);

function authed(id = "user1") {
  mockAuth.mockResolvedValue({ user: { id } } as never);
}

function makeWord(overrides: Partial<{
  id: string; jp: string; en: string; userId: string; createdAt: Date;
}> = {}) {
  return {
    id: "word1",
    jp: "食べる",
    en: "to eat",
    userId: "user1",
    createdAt: new Date(),
    ...overrides,
  };
}

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/vocab", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function deleteReq(body: unknown) {
  return new NextRequest("http://localhost/api/vocab", {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET ───────────────────────────────────────────────────────────────────────

describe("GET /api/vocab", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the user's vocabulary list", async () => {
    authed("user1");
    const words = [makeWord({ id: "w1" }), makeWord({ id: "w2" })];
    mockFindMany.mockResolvedValue(words as never);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it("queries only the authenticated user's words", async () => {
    authed("user42");
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user42" } })
    );
  });

  it("returns empty array when user has no words", async () => {
    authed();
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe("POST /api/vocab", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(postReq({ jp: "食べる", en: "to eat" }));
    expect(res.status).toBe(401);
  });

  it("creates a word and returns 201", async () => {
    authed("user1");
    const word = makeWord();
    mockFindFirst.mockResolvedValue(null as never);
    mockCreate.mockResolvedValue(word as never);
    const res = await POST(postReq({ jp: "食べる", en: "to eat" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.jp).toBe("食べる");
  });

  it("returns 400 when jp is missing", async () => {
    authed();
    const res = await POST(postReq({ en: "to eat" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when en is missing", async () => {
    authed();
    const res = await POST(postReq({ jp: "食べる" }));
    expect(res.status).toBe(400);
  });

  it("returns 422 when jp contains no Japanese characters", async () => {
    authed();
    const res = await POST(postReq({ jp: "taberu", en: "to eat" }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.code).toBe("JP_NOT_JAPANESE");
  });

  it("returns 409 when word already exists", async () => {
    authed("user1");
    mockFindFirst.mockResolvedValue(makeWord() as never);
    const res = await POST(postReq({ jp: "食べる", en: "to eat" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.code).toBe("DUPLICATE");
  });

  it("stores the authenticated user's id on the word", async () => {
    authed("user99");
    mockFindFirst.mockResolvedValue(null as never);
    mockCreate.mockResolvedValue(makeWord({ userId: "user99" }) as never);
    await POST(postReq({ jp: "飲む", en: "to drink" }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user99" }) })
    );
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe("DELETE /api/vocab", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(deleteReq({ id: "word1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authed();
    const res = await DELETE(deleteReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when word does not exist", async () => {
    authed();
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(deleteReq({ id: "unknown" }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when word belongs to a different user", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(makeWord({ userId: "user2" }) as never);
    const res = await DELETE(deleteReq({ id: "word1" }));
    expect(res.status).toBe(404);
  });

  it("deletes the word and returns success", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(makeWord({ userId: "user1" }) as never);
    mockDelete.mockResolvedValue(makeWord() as never);
    const res = await DELETE(deleteReq({ id: "word1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("only deletes the authenticated user's own word", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(makeWord({ id: "word1", userId: "user1" }) as never);
    mockDelete.mockResolvedValue(makeWord() as never);
    await DELETE(deleteReq({ id: "word1" }));
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "word1" } });
  });
});
