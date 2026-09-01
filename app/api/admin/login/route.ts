import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME, createSessionCookieValue, hashPassword } from "@/lib/auth";
import { getAdminPasswordHash } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!password) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }

  const storedHash = await getAdminPasswordHash();
  const isValid = storedHash
    ? (await hashPassword(password)) === storedHash
    : Boolean(process.env.ADMIN_PASSWORD) && password === process.env.ADMIN_PASSWORD;

  if (!storedHash && !process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD n'est pas configuré côté serveur." },
      { status: 500 }
    );
  }

  if (!isValid) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
