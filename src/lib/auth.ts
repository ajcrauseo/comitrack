import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export type Role = "ADMIN" | "VIEWER";

export interface SessionPayload {
  userId: string;
  role: Role;
}

const SALT_ROUNDS = 10;
const TOKEN_NAME = "session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está definido en el entorno");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getRequiredSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getRequiredSession();
  if (session.role !== "ADMIN") throw new Error("Acción restringida a administradores");
  return session;
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  cookieStore.set("role", payload.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set("role", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getRoleCookie(): Promise<Role | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get("role")?.value;
    if (value === "ADMIN" || value === "VIEWER") return value;
    return null;
  } catch {
    return null;
  }
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
