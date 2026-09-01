import { google, sheets_v4 } from "googleapis";
import { getGoogleAuth } from "./google-auth";
import { getTransporter } from "./mail";
import { buildNewsletterHtml } from "./newsletter-template";

export { buildNewsletterHtml };

// Colonnes du Sheet Prospects, en plus des 13 déjà utilisées par la capture
// de leads (A-M, voir lib/sheets.ts) — ajoutées spécifiquement pour la
// newsletter, sans toucher aux colonnes/index déjà lus ailleurs.
const PROSPECTS_RANGE = "Prospects!A2:O";
const PROSPECTS_SHEET = "Prospects";
const COL = {
  nom: 1,
  telephone: 4,
  email: 5,
  interetsCumules: 9,
  formationsInscrites: 10,
  ebooksTelecharges: 11,
  articlesDemandes: 12,
  desabonne: 13,
  token: 14,
} as const;

export interface NewsletterRecipient {
  email: string;
  nom: string;
  token: string;
}

function getSheetsClient(): sheets_v4.Sheets {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google Sheets n'est pas configuré.");
  return google.sheets({ version: "v4", auth });
}

function generateToken(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function matchesKeyword(row: string[], keyword: string): boolean {
  const haystack = [
    row[COL.interetsCumules],
    row[COL.formationsInscrites],
    row[COL.ebooksTelecharges],
    row[COL.articlesDemandes],
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

/**
 * Liste les destinataires éligibles (email non vide, non désabonné, et
 * correspondant au mot-clé d'intérêt si fourni). Génère et enregistre un
 * jeton de désabonnement pour toute fiche qui n'en a pas encore.
 */
export async function listNewsletterRecipients(keyword: string | null): Promise<NewsletterRecipient[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CONTACTS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_CONTACTS_ID manquant.");
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: PROSPECTS_RANGE });
  const rows = res.data.values ?? [];

  const tokenUpdates: { range: string; token: string }[] = [];
  const recipients: NewsletterRecipient[] = [];

  rows.forEach((row, index) => {
    const email = (row[COL.email] ?? "").trim();
    if (!email) return;
    if ((row[COL.desabonne] ?? "").trim().toUpperCase() === "OUI") return;
    if (keyword && !matchesKeyword(row, keyword)) return;

    let token = (row[COL.token] ?? "").trim();
    if (!token) {
      token = generateToken();
      const rowNumber = index + 2;
      tokenUpdates.push({ range: `${PROSPECTS_SHEET}!O${rowNumber}`, token });
    }

    recipients.push({ email, nom: (row[COL.nom] ?? "").trim(), token });
  });

  if (tokenUpdates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: tokenUpdates.map((u) => ({ range: u.range, values: [[u.token]] })),
      },
    });
  }

  return recipients;
}

/**
 * Marque un contact désabonné à partir de son jeton unique. Ne touche que
 * les colonnes N/O de sa ligne — n'interfère jamais avec la logique de
 * déduplication des leads (lib/sheets.ts).
 */
export async function unsubscribeByToken(token: string): Promise<"ok" | "already" | "not_found"> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CONTACTS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_CONTACTS_ID manquant.");
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: PROSPECTS_RANGE });
  const rows = res.data.values ?? [];
  const index = rows.findIndex((row) => (row[COL.token] ?? "").trim() === token);
  if (index === -1) return "not_found";

  const row = rows[index];
  if ((row[COL.desabonne] ?? "").trim().toUpperCase() === "OUI") return "already";

  const rowNumber = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${PROSPECTS_SHEET}!N${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [["OUI"]] },
  });
  return "ok";
}

export async function sendNewsletterToOne({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) throw new Error("Gmail n'est pas configuré (GMAIL_USER / GMAIL_APP_PASSWORD manquants).");
  await transporter.sendMail({
    from: `"AK World Business Services" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}
