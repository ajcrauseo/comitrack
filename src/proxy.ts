import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const TOKEN_NAME = "session";
const LOGIN_PATH = "/login";

const publicPaths = [LOGIN_PATH];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no definido");
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    response.cookies.set(TOKEN_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
