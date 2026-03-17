import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: vi.fn() } },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/user/profile/route";

const mockAuth = vi.mocked(auth);
const mockUpdate = vi.mocked(prisma.user.update);

function req(body: unknown) {
  return new NextRequest("http://localhost/api/user/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function authed(id = "user1") {
  mockAuth.mockResolvedValue({ user: { id } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({ id: "user1", name: "Test" } as never);
});

describe("PATCH /api/user/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(req({ name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    authed();
    const res = await PATCH(req({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    authed();
    const res = await PATCH(req({ name: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name exceeds 50 characters", async () => {
    authed();
    const res = await PATCH(req({ name: "a".repeat(51) }));
    expect(res.status).toBe(400);
  });

  it("updates name and returns trimmed value", async () => {
    authed();
    mockUpdate.mockResolvedValue({ id: "user1", name: "New Name" } as never);
    const res = await PATCH(req({ name: "  New Name  " }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.name).toBe("New Name");
  });

  it("calls prisma.user.update with correct args", async () => {
    authed("user42");
    await PATCH(req({ name: "Jose" }));
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user42" },
      data: { name: "Jose" },
    });
  });

  it("accepts name at exactly 50 characters", async () => {
    authed();
    const res = await PATCH(req({ name: "a".repeat(50) }));
    expect(res.status).toBe(200);
  });
});
