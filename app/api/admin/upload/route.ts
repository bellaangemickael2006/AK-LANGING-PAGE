import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/storage";
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from "@/lib/upload-constants";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { ok: false, error: `Fichier trop volumineux (${MAX_UPLOAD_SIZE_LABEL} maximum).` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveUploadedFile(buffer, file.name, file.type || "application/octet-stream");
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[api/admin/upload]", error);
    return NextResponse.json({ ok: false, error: "Échec de l'enregistrement du fichier." }, { status: 502 });
  }
}
