import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getAdminPasswordHash, setAdminPasswordHash } from "@/lib/sheets";

const MIN_LENGTH = 8;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Le nouveau mot de passe doit contenir au moins ${MIN_LENGTH} caractères.` },
      { status: 400 }
    );
  }

  const storedHash = await getAdminPasswordHash();
  const isCurrentValid = storedHash
    ? (await hashPassword(currentPassword)) === storedHash
    : Boolean(process.env.ADMIN_PASSWORD) && currentPassword === process.env.ADMIN_PASSWORD;

  if (!isCurrentValid) {
    return NextResponse.json({ ok: false, error: "Mot de passe actuel incorrect." }, { status: 401 });
  }

  try {
    await setAdminPasswordHash(await hashPassword(newPassword));
  } catch (error) {
    console.error("[api/admin/change-password]", error);
    return NextResponse.json({ ok: false, error: "Échec de l'enregistrement du nouveau mot de passe." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
