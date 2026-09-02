import { after, NextRequest, NextResponse } from "next/server";
import { isSheetsConfigured, upsertProspectAndLogEvent } from "@/lib/sheets";
import { sendConfirmationEmail } from "@/lib/mail";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { LeadPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: Partial<LeadPayload> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // Honeypot : un champ caché rempli signale un robot. On répond succès
  // pour ne pas l'alerter, mais on n'écrit rien dans les Sheets.
  if (body.honeypot) {
    return NextResponse.json({ ok: true });
  }

  const { nom, profession, activite, telephone, email, type, itemId, itemTitre, departement } = body;

  if (!telephone || !email) {
    return NextResponse.json({ ok: false, error: "Le téléphone et l'email sont obligatoires." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "L'adresse email n'est pas valide." }, { status: 400 });
  }
  if (!isValidPhone(telephone)) {
    return NextResponse.json({ ok: false, error: "Le numéro de téléphone n'est pas valide." }, { status: 400 });
  }
  if (!type || !itemId || !itemTitre) {
    return NextResponse.json({ ok: false, error: "Requête incomplète." }, { status: 400 });
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "L'enregistrement n'est pas encore activé pour ce site. Réessayez plus tard." },
      { status: 503 }
    );
  }

  try {
    await upsertProspectAndLogEvent({
      nom: nom ?? "",
      profession: profession ?? "",
      activite: activite ?? "",
      telephone,
      email,
      type,
      itemId,
      itemTitre,
      departement: departement ?? "",
    });
    // Best-effort : le lead est déjà en sécurité dans Sheets, un souci
    // d'envoi d'email ne doit pas faire échouer la réponse au visiteur.
    // after() (et non un simple appel non attendu) est nécessaire ici :
    // sur Vercel, une fonction serverless peut être gelée dès la réponse
    // envoyée, ce qui interromprait un envoi Gmail encore en cours.
    after(() => sendConfirmationEmail(email, type, itemTitre));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/lead] Erreur d'écriture Google Sheets:", error);
    return NextResponse.json(
      { ok: false, error: "Une erreur est survenue lors de l'enregistrement. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
