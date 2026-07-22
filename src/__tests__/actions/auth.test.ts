import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import { SignJWT } from "jose";

const JWT_SECRET = "test-secret-key-for-testing-only";

async function createAdminToken(): Promise<string> {
  return new SignJWT({ userId: "test-user-id", role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import {
  loginAdmin,
  loginViewer,
  logout,
  updateViewerPin,
  updateAdminPassword,
} from "@/actions/auth";
import { resetAttempts, recordFailedAttempt } from "@/lib/rate-limit";

const mockPrisma = vi.mocked(prisma);

beforeEach(async () => {
  vi.clearAllMocks();
  resetAttempts("login:testuser");
  resetAttempts("login:admin");
  resetAttempts("login:viewer");
  resetAttempts("login:viewer2");
});

describe("loginAdmin", () => {
  it("returns error when username is missing", async () => {
    const formData = new FormData();
    formData.set("password", "admin123");

    const result = await loginAdmin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("requeridos");
  });

  it("returns error when password is missing", async () => {
    const formData = new FormData();
    formData.set("username", "admin");

    const result = await loginAdmin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("requeridos");
  });

  it("returns error when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "wrongpass");

    const result = await loginAdmin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("inválidas");
  });

  it("returns error when password is wrong", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const hashedPassword = await hashPassword("admin123");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "testuser",
      adminPassword: hashedPassword,
      viewerPin: "hashed-pin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "wrongpass");

    const result = await loginAdmin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("inválidas");
  });

  it("redirects on successful login", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const hashedPassword = await hashPassword("admin123");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      username: "testuser",
      adminPassword: hashedPassword,
      viewerPin: "hashed-pin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "admin123");

    await expect(loginAdmin(formData)).rejects.toThrow("REDIRECT:/");
  });

  it("blocks when rate limit exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("login:testuser");
    }

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "admin123");

    const result = await loginAdmin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Demasiados intentos");
  });
});

describe("loginViewer", () => {
  it("returns error when username is missing", async () => {
    const formData = new FormData();
    formData.set("pin", "1234");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("requeridos");
  });

  it("returns error when pin is missing", async () => {
    const formData = new FormData();
    formData.set("username", "viewer");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("requeridos");
  });

  it("returns error for invalid pin format", async () => {
    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "abc");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("4 dígitos");
  });

  it("returns error for pin with wrong length", async () => {
    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "12");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("4 dígitos");
  });

  it("returns error when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "1234");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("inválidas");
  });

  it("returns error when pin is wrong", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const hashedPin = await hashPassword("5678");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      username: "viewer",
      adminPassword: "hashed-admin",
      viewerPin: hashedPin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "1234");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("inválidas");
  });

  it("redirects on successful login", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const hashedPin = await hashPassword("1234");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      username: "viewer",
      adminPassword: "hashed-admin",
      viewerPin: hashedPin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "1234");

    await expect(loginViewer(formData)).rejects.toThrow("REDIRECT:/");
  });

  it("blocks when rate limit exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("login:viewer");
    }

    const formData = new FormData();
    formData.set("username", "viewer");
    formData.set("pin", "1234");

    const result = await loginViewer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Demasiados intentos");
  });
});

describe("logout", () => {
  it("redirects to /login", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("updateViewerPin", () => {
  it("returns error when not admin", async () => {
    const { cookies } = await import("next/headers");
    const invalidToken = await new SignJWT({ userId: "viewer-id", role: "VIEWER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((name: string) => {
        if (name === "session") return { value: invalidToken };
        if (name === "role") return { value: "VIEWER" };
        return undefined;
      }),
      set: vi.fn(),
    } as any);

    const formData = new FormData();
    formData.set("newPin", "5678");

    const result = await updateViewerPin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No autorizado");
  });

  it("returns error for invalid pin format", async () => {
    const formData = new FormData();
    formData.set("newPin", "abc");

    const result = await updateViewerPin(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("4 dígitos");
  });
});

describe("updateAdminPassword", () => {
  it("returns error when not admin", async () => {
    const { cookies } = await import("next/headers");
    const invalidToken = await new SignJWT({ userId: "viewer-id", role: "VIEWER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((name: string) => {
        if (name === "session") return { value: invalidToken };
        if (name === "role") return { value: "VIEWER" };
        return undefined;
      }),
      set: vi.fn(),
    } as any);

    const formData = new FormData();
    formData.set("currentPassword", "old");
    formData.set("newPassword", "new123");
    formData.set("confirmPassword", "new123");

    const result = await updateAdminPassword(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No autorizado");
  });

  it("returns error when fields are missing", async () => {
    const formData = new FormData();

    const result = await updateAdminPassword(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("requeridos");
  });

  it("returns error when new password is too short", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "oldpassword");
    formData.set("newPassword", "123");
    formData.set("confirmPassword", "123");

    const result = await updateAdminPassword(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("6 caracteres");
  });

  it("returns error when passwords do not match", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "oldpassword");
    formData.set("newPassword", "newpass123");
    formData.set("confirmPassword", "different123");

    const result = await updateAdminPassword(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("no coinciden");
  });
});
