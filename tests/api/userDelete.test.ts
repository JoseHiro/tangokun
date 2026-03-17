import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), delete: vi.fn() },
    vocabularyProgress: { deleteMany: vi.fn() },
    mistakeLog: { deleteMany: vi.fn() },
    practiceLog: { deleteMany: vi.fn() },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DELETE } from "@/app/api/user/delete/route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockDeleteUser = vi.mocked(prisma.user.delete);
const mockDeleteProgress = vi.mocked(prisma.vocabularyProgress.deleteMany);
const mockDeleteMistakes = vi.mocked(prisma.mistakeLog.deleteMany);
const mockDeleteLogs = vi.mocked(prisma.practiceLog.deleteMany);

function req(body: unknown) {
  return new NextRequest("http://localhost/api/user/delete", {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function authed(id = "user1") {
  mockAuth.mockResolvedValue({ user: { id } } as never);
}

function dbUser(overrides: Partial<{ name: string; email: string }> = {}) {
  return {
    id: "user1",
    name: "Jose",
    email: "jose@example.com",
    ...overrides,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteUser.mockResolvedValue({} as never);
  mockDeleteProgress.mockResolvedValue({ count: 0 } as never);
  mockDeleteMistakes.mockResolvedValue({ count: 0 } as never);
  mockDeleteLogs.mockResolvedValue({ count: 0 } as never);
});

describe("DELETE /api/user/delete", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(req({ confirm: "Jose" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when confirm field is missing", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    const res = await DELETE(req({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when confirmation text does not match name or email", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    const res = await DELETE(req({ confirm: "wrong text" }));
    expect(res.status).toBe(400);
  });

  it("succeeds when confirmation matches user name", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser({ name: "Jose" }));
    const res = await DELETE(req({ confirm: "Jose" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("succeeds when confirmation matches user email", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser({ email: "jose@example.com" }));
    const res = await DELETE(req({ confirm: "jose@example.com" }));
    expect(res.status).toBe(200);
  });

  it("deletes VocabularyProgress, MistakeLog, and PracticeLog before user", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(dbUser());
    await DELETE(req({ confirm: "Jose" }));

    expect(mockDeleteProgress).toHaveBeenCalledWith({ where: { userId: "user1" } });
    expect(mockDeleteMistakes).toHaveBeenCalledWith({ where: { userId: "user1" } });
    expect(mockDeleteLogs).toHaveBeenCalledWith({ where: { userId: "user1" } });
  });

  it("deletes user after related data", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(dbUser());
    await DELETE(req({ confirm: "Jose" }));
    expect(mockDeleteUser).toHaveBeenCalledWith({ where: { id: "user1" } });
  });

  it("deletion order: related data before user", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    const order: string[] = [];
    mockDeleteProgress.mockImplementation(async () => { order.push("progress"); return { count: 0 }; });
    mockDeleteMistakes.mockImplementation(async () => { order.push("mistakes"); return { count: 0 }; });
    mockDeleteLogs.mockImplementation(async () => { order.push("logs"); return { count: 0 }; });
    mockDeleteUser.mockImplementation(async () => { order.push("user"); return {} as never; });

    await DELETE(req({ confirm: "Jose" }));
    expect(order.indexOf("user")).toBeGreaterThan(order.indexOf("progress"));
    expect(order.indexOf("user")).toBeGreaterThan(order.indexOf("mistakes"));
    expect(order.indexOf("user")).toBeGreaterThan(order.indexOf("logs"));
  });
});
