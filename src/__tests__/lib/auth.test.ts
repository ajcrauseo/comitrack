import { describe, it, expect, vi } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  validatePin,
  getSession,
  getRequiredSession,
  requireAdmin,
} from "@/lib/auth";

describe("validatePin", () => {
  it("accepts valid 4-digit PINs", () => {
    expect(validatePin("0000")).toBe(true);
    expect(validatePin("1234")).toBe(true);
    expect(validatePin("9999")).toBe(true);
    expect(validatePin("5678")).toBe(true);
  });

  it("rejects non-numeric strings", () => {
    expect(validatePin("abcd")).toBe(false);
    expect(validatePin("12ab")).toBe(false);
    expect(validatePin("a123")).toBe(false);
  });

  it("rejects strings with wrong length", () => {
    expect(validatePin("123")).toBe(false);
    expect(validatePin("12345")).toBe(false);
    expect(validatePin("")).toBe(false);
    expect(validatePin("12")).toBe(false);
  });

  it("rejects strings with special characters", () => {
    expect(validatePin("12-4")).toBe(false);
    expect(validatePin("12.4")).toBe(false);
    expect(validatePin("12 4")).toBe(false);
    expect(validatePin("12_4")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validatePin("")).toBe(false);
  });
});

describe("hashPassword and verifyPassword", () => {
  it("creates a hash and verifies the password", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(typeof hash).toBe("string");

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correctPassword");
    const valid = await verifyPassword("wrongPassword", hash);
    expect(valid).toBe(false);
  });

  it("produces different hashes for same input (different salts)", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string password", async () => {
    const hash = await hashPassword("");
    expect(await verifyPassword("", hash)).toBe(true);
    expect(await verifyPassword("notempty", hash)).toBe(false);
  });

  it("handles special characters in password", async () => {
    const password = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("handles long password", async () => {
    const password = "a".repeat(1000);
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });
});

describe("createToken and verifyToken", () => {
  const payload = { userId: "user-123", role: "ADMIN" as const };

  it("creates and verifies a valid token", async () => {
    const token = await createToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).toBeTruthy();
    expect(verified?.userId).toBe("user-123");
    expect(verified?.role).toBe("ADMIN");
  });

  it("returns null for invalid token", async () => {
    const result = await verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("returns null for empty string", async () => {
    const result = await verifyToken("");
    expect(result).toBeNull();
  });

  it("returns null for token signed with wrong secret", async () => {
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("wrong-secret-key");
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(wrongSecret);

    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it("returns null for expired token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(secret);

    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it("round-trips VIEWER role correctly", async () => {
    const viewerPayload = { userId: "user-456", role: "VIEWER" as const };
    const token = await createToken(viewerPayload);
    const verified = await verifyToken(token);

    expect(verified?.role).toBe("VIEWER");
    expect(verified?.userId).toBe("user-456");
  });
});

describe("getSession", () => {
  it("returns session from valid cookie", async () => {
    const session = await getSession();
    expect(session).toBeTruthy();
    expect(session?.userId).toBe("test-user-id");
    expect(session?.role).toBe("ADMIN");
  });

  it("returns null when no cookie", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => undefined),
      set: vi.fn(),
    } as any);

    const result = await getSession();
    expect(result).toBeNull();
  });
});

describe("getRequiredSession", () => {
  it("returns session when authenticated", async () => {
    const session = await getRequiredSession();
    expect(session).toBeTruthy();
    expect(session.userId).toBe("test-user-id");
  });

  it("throws when no session", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => undefined),
      set: vi.fn(),
    } as any);

    await expect(getRequiredSession()).rejects.toThrow("No autenticado");
  });
});

describe("requireAdmin", () => {
  it("returns session for ADMIN role", async () => {
    const session = await requireAdmin();
    expect(session).toBeTruthy();
    expect(session.role).toBe("ADMIN");
  });

  it("throws for VIEWER role", async () => {
    const { cookies } = await import("next/headers");
    const { SignJWT } = await import("jose");
    const viewerToken = await new SignJWT({ userId: "viewer-id", role: "VIEWER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((name: string) => {
        if (name === "session") return { value: viewerToken };
        if (name === "role") return { value: "VIEWER" };
        return undefined;
      }),
      set: vi.fn(),
    } as any);

    await expect(requireAdmin()).rejects.toThrow("Acción restringida a administradores");
  });
});
