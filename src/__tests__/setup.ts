import { vi, beforeAll } from "vitest";
import { SignJWT } from "jose";

const JWT_SECRET = "test-secret-key-for-testing-only";

process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = "test";

let mockToken = "";

async function createMockToken(payload: { userId: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => {
      if (name === "session") {
        return { value: mockToken };
      }
      if (name === "role") {
        return { value: "ADMIN" };
      }
      return undefined;
    }),
    set: vi.fn(),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

beforeAll(async () => {
  mockToken = await createMockToken({ userId: "test-user-id", role: "ADMIN" });
});
