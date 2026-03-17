import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PATCH } from "@/app/api/user/password/route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);
const mockCompare = vi.mocked(bcrypt.compare);
const mockHash = vi.mocked(bcrypt.hash);

function req(body: unknown) {
  return new NextRequest("http://localhost/api/user/password", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function authed(id = "user1") {
  mockAuth.mockResolvedValue({ user: { id } } as never);
}

function dbUser(password: string | null = "hashed_old") {
  return { id: "user1", password } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({} as never);
  mockHash.mockResolvedValue("hashed_new" as never);
});

describe("PATCH /api/user/password", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(req({ currentPassword: "old", newPassword: "newpass1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when fields are missing", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    const res = await PATCH(req({ currentPassword: "old" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 with error 'no password' for Google-only accounts", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser(null));
    const res = await PATCH(req({ currentPassword: "old", newPassword: "newpass1" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("no password");
  });

  it("returns 400 when current password is incorrect", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    mockCompare.mockResolvedValue(false as never);
    const res = await PATCH(req({ currentPassword: "wrong", newPassword: "newpass1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when new password is shorter than 8 characters", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    mockCompare.mockResolvedValue(true as never);
    const res = await PATCH(req({ currentPassword: "old", newPassword: "short" }));
    expect(res.status).toBe(400);
  });

  it("hashes new password and updates DB on success", async () => {
    authed("user1");
    mockFindUnique.mockResolvedValue(dbUser());
    mockCompare.mockResolvedValue(true as never);
    const res = await PATCH(req({ currentPassword: "oldpassword", newPassword: "newpassword1" }));
    expect(res.status).toBe(200);
    expect(mockHash).toHaveBeenCalledWith("newpassword1", 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { password: "hashed_new" },
    });
  });

  it("returns { ok: true } on success", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    mockCompare.mockResolvedValue(true as never);
    const res = await PATCH(req({ currentPassword: "old", newPassword: "newpassword1" }));
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("accepts new password exactly 8 characters", async () => {
    authed();
    mockFindUnique.mockResolvedValue(dbUser());
    mockCompare.mockResolvedValue(true as never);
    const res = await PATCH(req({ currentPassword: "old", newPassword: "exactly8" }));
    expect(res.status).toBe(200);
  });
});
