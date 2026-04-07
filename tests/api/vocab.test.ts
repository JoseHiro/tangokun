import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vocabulary: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    vocabularyProgress: {
      findMany: vi.fn(),
    },
    deck: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST, DELETE } from "@/app/api/vocab/route";

function getReq(query = "") {
  return new NextRequest(`http://localhost/api/vocab${query ? `?${query}` : ""}`, { method: "GET" });
}

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.vocabulary.findMany);
const mockCount = vi.mocked(prisma.vocabulary.count);
const mockFindFirst = vi.mocked(prisma.vocabulary.findFirst);
const mockCreate = vi.mocked(prisma.vocabulary.create);
const mockFindUnique = vi.mocked(prisma.vocabulary.findUnique);
const mockDelete = vi.mocked(prisma.vocabulary.delete);
const mockDeleteMany = vi.mocked(prisma.vocabulary.deleteMany);
const mockProgressFindMany = vi.mocked(prisma.vocabularyProgress.findMany);

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
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it("returns paginated words and total", async () => {
    authed("user1");
    const words = [makeWord({ id: "w1" }), makeWord({ id: "w2" })];
    mockFindMany.mockResolvedValue(words as never);
    mockCount.mockResolvedValue(2 as never);
    mockProgressFindMany.mockResolvedValue([] as never);
    const res = await GET(getReq());
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.words).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it("queries only the authenticated user's words", async () => {
    authed("user42");
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0 as never);
    mockProgressFindMany.mockResolvedValue([] as never);
    await GET(getReq());
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user42" }) })
    );
  });

  it("returns empty words when user has none", async () => {
    authed();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0 as never);
    mockProgressFindMany.mockResolvedValue([] as never);
    const res = await GET(getReq());
    const data = await res.json();
    expect(data.words).toEqual([]);
    expect(data.total).toBe(0);
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

  it("returns 404 when word does not exist (single id)", async () => {
    authed();
    mockDeleteMany.mockResolvedValue({ count: 0 });
    const res = await DELETE(deleteReq({ id: "unknown" }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when single id does not belong to user", async () => {
    authed("user1");
    mockDeleteMany.mockResolvedValue({ count: 0 });
    const res = await DELETE(deleteReq({ id: "word1" }));
    expect(res.status).toBe(404);
  });

  it("deletes the word and returns success", async () => {
    authed("user1");
    mockDeleteMany.mockResolvedValue({ count: 1 });
    const res = await DELETE(deleteReq({ id: "word1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(1);
  });

  it("deleteMany scopes to authenticated user", async () => {
    authed("user1");
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await DELETE(deleteReq({ id: "word1" }));
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user1", id: { in: ["word1"] } },
    });
  });

  it("deletes multiple ids in one request", async () => {
    authed("user1");
    mockDeleteMany.mockResolvedValue({ count: 2 });
    const res = await DELETE(deleteReq({ ids: ["a", "b", "a"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(2);
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user1", id: { in: ["a", "b"] } },
    });
  });
});
