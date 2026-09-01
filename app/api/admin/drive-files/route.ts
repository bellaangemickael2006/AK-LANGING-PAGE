import { NextRequest, NextResponse } from "next/server";
import { listDriveFiles } from "@/lib/drive";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") === "document" ? "document" : "image";
  try {
    const files = await listDriveFiles(kind);
    return NextResponse.json({ ok: true, files });
  } catch (error) {
    console.error("[api/admin/drive-files]", error);
    return NextResponse.json({ ok: false, error: "Impossible de lister les fichiers Drive." }, { status: 502 });
  }
}
