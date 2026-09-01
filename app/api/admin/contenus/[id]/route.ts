import { NextRequest, NextResponse } from "next/server";
import { deleteContenu, updateContenu } from "@/lib/sheets";
import { ContentItem } from "@/lib/types";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as Partial<ContentItem> | null;
  if (!body || !body.titre?.trim()) {
    return NextResponse.json({ ok: false, error: "Le titre est obligatoire." }, { status: 400 });
  }

  const item: ContentItem = {
    id,
    type: body.type ?? "actualite",
    titre: body.titre.trim(),
    chapo: body.chapo ?? "",
    corps: body.corps ?? "",
    imageUrl: body.imageUrl ?? "",
    datePublication: body.datePublication ?? "",
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
    await updateContenu(id, item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error("[api/admin/contenus/:id] PUT", error);
    return NextResponse.json({ ok: false, error: "Mise à jour impossible." }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await deleteContenu(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/contenus/:id] DELETE", error);
    return NextResponse.json({ ok: false, error: "Suppression impossible." }, { status: 502 });
  }
}
