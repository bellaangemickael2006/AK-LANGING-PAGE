import { NextRequest, NextResponse } from "next/server";
import { listNewsletterRecipients } from "@/lib/newsletter";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword")?.trim() || null;
  try {
    const recipients = await listNewsletterRecipients(keyword);
    return NextResponse.json({ ok: true, count: recipients.length, recipients });
  } catch (error) {
    console.error("[api/admin/newsletter/recipients]", error);
    return NextResponse.json({ ok: false, error: "Impossible de lister les destinataires." }, { status: 502 });
  }
}
