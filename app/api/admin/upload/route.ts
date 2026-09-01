import { NextRequest, NextResponse } from "next/server";
import { saveLocalFile } from "@/lib/local-storage";

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "Fichier trop volumineux (20 Mo maximum)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveLocalFile(buffer, file.name);
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[api/admin/upload]", error);
    return NextResponse.json({ ok: false, error: "Échec de l'enregistrement du fichier." }, { status: 502 });
  }
}
