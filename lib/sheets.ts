import { unstable_cache } from "next/cache";
import { google, sheets_v4 } from "googleapis";
import { ContentItem, ContentType, CtaAction, LeadPayload } from "./types";
import { normalizeEmail, normalizePhone } from "./validation";
import { getGoogleAuth } from "./google-auth";

const CONTENT_RANGE = "Contenus!A2:O";
const PROSPECTS_RANGE = "Prospects!A2:M";
const PROSPECTS_SHEET = "Prospects";
const EVENEMENTS_SHEET = "Evenements";

const VALID_TYPES: ContentType[] = ["actualite", "formation", "ebook", "article", "promotion"];
const VALID_CTA: CtaAction[] = ["inscription", "telechargement", "info"];

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_CONTENT_ID &&
      process.env.GOOGLE_SHEETS_CONTACTS_ID
  );
}

/**
 * Vercel / .env.local stockent la clé privée avec des "\n" littéraux au lieu
 * de vrais retours à la ligne — sans ce remplacement, l'authentification
 * Google échoue silencieusement (piège classique).
 */
let cachedClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google Sheets n'est pas configuré (variables d'environnement manquantes).");
  if (!cachedClient) {
    cachedClient = google.sheets({ version: "v4", auth });
  }
  return cachedClient;
}

function toBool(value: string | undefined): boolean {
  return (value ?? "").trim().toUpperCase() === "OUI";
}

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Lecture défensive : une ligne saisie de travers dans Google Sheets (type
 * invalide, titre vide) est simplement ignorée plutôt que de faire planter
 * la page — le personnel du cabinet n'est pas développeur.
 */
function rowToContentItem(row: string[], index: number): ContentItem | null {
  const [
    id,
    type,
    titre,
    chapo,
    corps,
    imageUrl,
    datePublication,
    dateFin,
    departement,
    ctaLabel,
    ctaAction,
    fichierUrl,
    visible,
    ordre,
    infosPratiques,
  ] = row;

  if (!id?.trim() || !titre?.trim()) return null;
  if (!VALID_TYPES.includes(type as ContentType)) return null;

  return {
    id: id.trim(),
    type: type as ContentType,
    titre: titre.trim(),
    chapo: chapo ?? "",
    corps: corps ?? "",
    imageUrl: imageUrl ?? "",
    datePublication: datePublication ?? "",
    dateFin: dateFin ?? "",
    departement: departement ?? "",
    ctaLabel: ctaLabel ?? "",
    ctaAction: VALID_CTA.includes(ctaAction as CtaAction) ? (ctaAction as CtaAction) : "info",
    fichierUrl: fichierUrl ?? "",
    visible: toBool(visible),
    ordre: toNumber(ordre, 1000 + index),
    infosPratiques: infosPratiques ?? "",
  };
}

async function fetchContenusFromSheet(): Promise<ContentItem[] | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CONTENT_ID;
  if (!spreadsheetId || !isSheetsConfigured()) return null;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: CONTENT_RANGE,
    });
    const rows = res.data.values ?? [];
    const items = rows
      .map((row, index) => rowToContentItem(row as string[], index))
      .filter((item): item is ContentItem => item !== null && item.visible);
    items.sort((a, b) => a.ordre - b.ordre);
    return items;
  } catch (error) {
    console.error("[sheets] Erreur de lecture des Contenus:", error);
    return null;
  }
}

/**
 * Lit l'onglet "Contenus" du Sheet de contenu, avec un cache de 60s partagé
 * entre tous les visiteurs (et pas un appel Google Sheets par visite) —
 * important car l'API Sheets impose un quota de lecture par minute.
 * Retourne null en cas d'échec pour que l'appelant bascule sur le contenu
 * de démonstration sans planter.
 */
export const getContenus = unstable_cache(fetchContenusFromSheet, ["ak-contenus-publics"], {
  revalidate: 60,
});

function requireContentSheetId(): string {
  const id = process.env.GOOGLE_SHEETS_CONTENT_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_CONTENT_ID manquant.");
  return id;
}

/**
 * Version admin de la lecture des Contenus : renvoie TOUTES les lignes
 * (y compris masquées ou mal remplies) pour que le tableau de bord puisse
 * les afficher et les corriger, contrairement à getContenus() qui filtre
 * pour l'affichage public.
 */
export async function listAllContenusForAdmin(): Promise<ContentItem[]> {
  const spreadsheetId = requireContentSheetId();
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: CONTENT_RANGE });
  const rows = res.data.values ?? [];
  return rows
    .map((row, index) => {
      const r = row as string[];
      const [
        id, type, titre, chapo, corps, imageUrl, datePublication, dateFin,
        departement, ctaLabel, ctaAction, fichierUrl, visible, ordre, infosPratiques,
      ] = r;
      if (!id?.trim()) return null;
      const item: ContentItem = {
        id: id.trim(),
        type: VALID_TYPES.includes(type as ContentType) ? (type as ContentType) : "actualite",
        titre: titre ?? "",
        chapo: chapo ?? "",
        corps: corps ?? "",
        imageUrl: imageUrl ?? "",
        datePublication: datePublication ?? "",
        dateFin: dateFin ?? "",
        departement: departement ?? "",
        ctaLabel: ctaLabel ?? "",
        ctaAction: VALID_CTA.includes(ctaAction as CtaAction) ? (ctaAction as CtaAction) : "info",
        fichierUrl: fichierUrl ?? "",
        visible: toBool(visible),
        ordre: toNumber(ordre, 1000 + index),
        infosPratiques: infosPratiques ?? "",
      };
      return item;
    })
    .filter((item): item is ContentItem => item !== null)
    .sort((a, b) => a.ordre - b.ordre);
}

function contentItemToRow(item: ContentItem): string[] {
  return [
    item.id,
    item.type,
    item.titre,
    item.chapo,
    item.corps,
    item.imageUrl,
    item.datePublication,
    item.dateFin,
    item.departement,
    item.ctaLabel,
    item.ctaAction,
    item.fichierUrl,
    item.visible ? "OUI" : "NON",
    String(item.ordre),
    item.infosPratiques,
  ];
}

async function findContenuRowNumber(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  id: string
): Promise<number | null> {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Contenus!A2:A" });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex((r) => (r[0] ?? "").trim() === id);
  return idx === -1 ? null : idx + 2;
}

export async function createContenu(item: ContentItem): Promise<void> {
  const spreadsheetId = requireContentSheetId();
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Contenus!A:O",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [contentItemToRow(item)] },
  });
}

export async function updateContenu(id: string, item: ContentItem): Promise<void> {
  const spreadsheetId = requireContentSheetId();
  const sheets = getSheetsClient();
  const rowNumber = await findContenuRowNumber(sheets, spreadsheetId, id);
  if (!rowNumber) throw new Error("Ce contenu n'existe plus (il a peut-être été supprimé).");
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Contenus!A${rowNumber}:O${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [contentItemToRow({ ...item, id })] },
  });
}

export async function deleteContenu(id: string): Promise<void> {
  const spreadsheetId = requireContentSheetId();
  const sheets = getSheetsClient();
  const rowNumber = await findContenuRowNumber(sheets, spreadsheetId, id);
  if (!rowNumber) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === "Contenus");
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId == null) throw new Error('Onglet "Contenus" introuvable.');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber } } },
      ],
    },
  });
}

interface ProspectRow {
  rowNumber: number; // numéro de ligne réel dans la feuille (1-indexé, header = ligne 1)
  values: string[];
}

async function findMatchingProspect(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  normalizedEmail: string,
  normalizedPhone: string
): Promise<ProspectRow | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: PROSPECTS_RANGE,
  });
  const rows = res.data.values ?? [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as string[];
    const rowEmail = normalizeEmail(row[5] ?? "");
    const rowPhone = normalizePhone(row[4] ?? "");
    const emailMatches = normalizedEmail && rowEmail && rowEmail === normalizedEmail;
    const phoneMatches = normalizedPhone && rowPhone && rowPhone === normalizedPhone;
    if (emailMatches || phoneMatches) {
      return { rowNumber: i + 2, values: row };
    }
  }
  return null;
}

function mergeList(existing: string, addition: string): string {
  const items = existing
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (addition && !items.includes(addition)) items.push(addition);
  return items.join(", ");
}

function fieldForType(type: LeadPayload["type"]): "formations_inscrites" | "ebooks_telecharges" | "articles_demandes" | null {
  if (type === "inscription") return "formations_inscrites";
  if (type === "telechargement") return "ebooks_telecharges";
  if (type === "info") return "articles_demandes";
  return null;
}

/**
 * Ajoute ou met à jour une fiche Prospect (déduplication par email puis par
 * téléphone) et journalise l'action dans Evenements. Ne crée jamais deux
 * lignes Prospects pour la même personne, même si elle s'inscrit à
 * plusieurs formations/ebooks au fil du temps.
 */
export async function upsertProspectAndLogEvent(payload: LeadPayload): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CONTACTS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_CONTACTS_ID manquant.");

  const sheets = getSheetsClient();
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPhone = normalizePhone(payload.telephone);
  const now = new Date().toISOString();

  const existing = await findMatchingProspect(sheets, spreadsheetId, normalizedEmail, normalizedPhone);

  const interestLabel = payload.departement || payload.itemTitre;
  const listField = fieldForType(payload.type);

  if (existing) {
    const v = existing.values;
    const nom = v[1] || payload.nom;
    const profession = v[2] || payload.profession;
    const activite = v[3] || payload.activite;
    const telephone = v[4] || payload.telephone;
    const email = v[5] || payload.email;
    const datePremiereCapture = v[6] || now;
    const sourcePremiere = v[8] || payload.itemTitre;
    const interetsCumules = mergeList(v[9] ?? "", interestLabel);
    const formationsInscrites = mergeList(v[10] ?? "", listField === "formations_inscrites" ? payload.itemTitre : "");
    const ebooksTelecharges = mergeList(v[11] ?? "", listField === "ebooks_telecharges" ? payload.itemTitre : "");
    const articlesDemandes = mergeList(v[12] ?? "", listField === "articles_demandes" ? payload.itemTitre : "");

    const updatedRow = [
      v[0],
      nom,
      profession,
      activite,
      telephone,
      email,
      datePremiereCapture,
      now,
      sourcePremiere,
      interetsCumules,
      formationsInscrites,
      ebooksTelecharges,
      articlesDemandes,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${PROSPECTS_SHEET}!A${existing.rowNumber}:M${existing.rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });
  } else {
    const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const newRow = [
      id,
      payload.nom,
      payload.profession,
      payload.activite,
      payload.telephone,
      payload.email,
      now,
      now,
      payload.itemTitre,
      interestLabel,
      listField === "formations_inscrites" ? payload.itemTitre : "",
      listField === "ebooks_telecharges" ? payload.itemTitre : "",
      listField === "articles_demandes" ? payload.itemTitre : "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${PROSPECTS_SHEET}!A:M`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${EVENEMENTS_SHEET}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[now, payload.email, payload.telephone, payload.type, payload.itemId, payload.itemTitre, payload.departement]],
    },
  });
}

const CONFIG_SHEET = "Config";

/**
 * Le mot de passe admin vit par défaut dans la variable d'environnement
 * ADMIN_PASSWORD (Vercel), qu'on ne peut pas modifier depuis l'application
 * elle-même. Une fois changé depuis le tableau de bord, son hash est stocké
 * ici (onglet "Config", créé à la volée) et prend le pas sur la variable
 * d'environnement. Retourne null si aucun changement n'a encore été fait.
 */
export async function getAdminPasswordHash(): Promise<string | null> {
  if (!isSheetsConfigured()) return null;
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: requireContentSheetId(),
      range: `${CONFIG_SHEET}!B1`,
    });
    return res.data.values?.[0]?.[0]?.trim() || null;
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  const spreadsheetId = requireContentSheetId();
  const sheets = getSheetsClient();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
  if (!existingTitles.includes(CONFIG_SHEET)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: CONFIG_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${CONFIG_SHEET}!A1:B1`,
    valueInputOption: "RAW",
    requestBody: { values: [["admin_password_hash", hash]] },
  });
}
