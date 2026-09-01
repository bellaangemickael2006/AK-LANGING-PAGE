import { NextRequest, NextResponse } from "next/server";
import { buildNewsletterHtml, sendNewsletterToOne } from "@/lib/newsletter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { to, subject, message, imageUrls, token } = body ?? {};

  if (!to || !subject || !message || !token) {
    return NextResponse.json({ ok: false, error: "Requête incomplète." }, { status: 400 });
  }

  const unsubscribeUrl = new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, req.nextUrl.origin).toString();
  const html = buildNewsletterHtml({ message, imageUrls: Array.isArray(imageUrls) ? imageUrls : [], unsubscribeUrl });
  const text = `${message}\n\nSe désabonner : ${unsubscribeUrl}`;

  try {
    await sendNewsletterToOne({ to, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/newsletter/send]", error);
    const errorMessage = error instanceof Error ? error.message : "Échec de l'envoi.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 502 });
  }
}
