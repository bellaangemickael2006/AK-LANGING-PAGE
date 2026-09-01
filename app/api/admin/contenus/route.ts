import { NextRequest, NextResponse } from "next/server";
import { createContenu, listAllContenusForAdmin } from "@/lib/sheets";
import { ContentItem } from "@/lib/types";

export async function GET() {
  try {
    const items = await listAllContenusForAdmin();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[api/admin/contenus] GET", error);
    return NextResponse.json({ ok: false, error: "Lecture impossible. Vérifiez la configuration Google Sheets." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<ContentItem> | null;
  if (!body || !body.titre?.trim()) {
    return NextResponse.json({ ok: false, error: "Le titre est obligatoire." }, { status: 400 });
  }

  const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const item: ContentItem = {
    id,
    type: body.type ?? "actualite",
    titre: body.titre.trim(),
    chapo: body.chapo ?? "",
    corps: body.corps ?? "",
    imageUrl: body.imageUrl ?? "",
    datePublication: body.datePublication ?? new Date().toISOString().slice(0, 10),
    dateFin: body.dateFin ?? "",
    departement: body.departement ?? "",
    ctaLabel: body.ctaLabel ?? "",
    ctaAction: body.ctaAction ?? "info",
    fichierUrl: body.fichierUrl ?? "",
    visible: body.visible ?? true,
    ordre: typeof body.ordre === "number" ? body.ordre : 999,
    infosPratiques: body.infosPratiques ?? "",
    imageOrientation: body.imageOrientation === "portrait" ? "portrait" : "paysage",
  };

  try {
    await createContenu(item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error("[api/admin/contenus] POST", error);
    return NextResponse.json({ ok: false, error: "Écriture impossible." }, { status: 502 });
  }
}
