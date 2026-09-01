// Provisionne le classeur Google Sheets : crée les onglets Contenus /
// Prospects / Evenements s'ils manquent, pose les en-têtes de colonnes, et
// seed l'onglet Contenus avec le contenu de démonstration s'il est vide.
//
// Usage : node --env-file=.env.local scripts/setup-sheets.mjs
//
// Ce même script sert à la migration vers le compte Google du cabinet :
// changez les variables d'environnement puis relancez-le sur le nouveau
// classeur.

import { google } from "googleapis";

const CONTENT_HEADERS = [
  "id", "type", "titre", "chapo", "corps", "image_url", "date_publication",
  "date_fin", "departement", "cta_label", "cta_action", "fichier_url",
  "visible", "ordre", "infos_pratiques",
];
const PROSPECTS_HEADERS = [
  "id", "nom", "profession", "activite", "telephone", "email",
  "date_premiere_capture", "date_derniere_activite", "source_premiere",
  "interets_cumules", "formations_inscrites", "ebooks_telecharges", "articles_demandes",
  "desabonne", "token_desabonnement",
];
const EVENEMENTS_HEADERS = ["timestamp", "email", "telephone", "type", "item_id", "item_titre", "departement"];

const SEED_ROWS = [
  ["actu-1", "actualite", "Nouvelle session d'accompagnement pour les TPE d'Angré", "AK World Business Services lance une nouvelle vague d'accompagnement pour les petites entreprises du quartier.", "Le cabinet poursuit son travail de proximité auprès des TPE et PME de la zone d'Angré : diagnostic de gestion, mise en place d'outils de suivi comptable et accompagnement personnalisé sur plusieurs mois.", "", "2026-08-20", "", "Conseil & accompagnement", "En savoir plus", "info", "", "OUI", "1", ""],
  ["actu-2", "promotion", "Places limitées sur la formation Gestion de projet", "10 places offertes aux jeunes entrepreneurs pour la prochaine session de formation en gestion de projet.", "Une occasion pour les porteurs de projet d'acquérir les bases essentielles de la gestion de projet, animée par les consultants du cabinet.", "", "2026-08-25", "2026-09-15", "Formation professionnelle", "Je m'inscris", "inscription", "", "OUI", "2", "Places limitées — priorité aux 18-35 ans porteurs de projet."],
  ["actu-3", "actualite", "Publication : les bonnes pratiques comptables pour les coopératives", "Un nouveau guide pratique publié par le cabinet à destination des coopératives et associations accompagnées.", "Ce guide reprend les principales bonnes pratiques observées sur le terrain par les consultants d'AK World Business Services au cours des accompagnements récents.", "", "2026-08-10", "", "Publication", "En savoir plus", "info", "", "OUI", "3", ""],
  ["formation-gestion-projet", "formation", "Gestion de projet", "Structurer, planifier et piloter un projet du démarrage à la clôture.", "Formation pratique destinée aux porteurs de projet et responsables d'équipe : cadrage, planification, suivi budgétaire et gestion des risques.", "", "2026-08-01", "", "Formation professionnelle", "M'inscrire", "inscription", "", "OUI", "4", "Durée : 3 jours · Abidjan, Angré"],
  ["formation-rh-tpe", "formation", "RH pour TPE", "Les bases de la gestion du personnel pour les petites structures.", "Recrutement, contrats, obligations légales et gestion quotidienne des équipes.", "", "2026-08-01", "", "Formation professionnelle", "M'inscrire", "inscription", "", "OUI", "5", "Durée : 2 jours · Abidjan, Angré"],
  ["formation-marketing-digital", "formation", "Marketing digital", "Développer sa visibilité et ses ventes en ligne.", "Réseaux sociaux, contenu, publicité en ligne : une initiation concrète pour les entrepreneurs.", "", "2026-08-01", "", "Formation professionnelle", "M'inscrire", "inscription", "", "OUI", "6", "Durée : 2 jours · Abidjan, Angré"],
  ["ebook-piloter-sa-tpe", "ebook", "Piloter sa TPE", "Le guide pratique pour garder le contrôle de sa gestion au quotidien.", "Un ebook synthétique pour comprendre les indicateurs essentiels à suivre lorsqu'on dirige une petite entreprise en Côte d'Ivoire.", "", "2026-07-15", "", "Ressources", "Télécharger", "telechargement", "", "OUI", "7", "Format PDF · 24 pages"],
  ["ebook-jeunes-entrepreneuriat", "ebook", "Jeunes et entrepreneuriat", "De l'idée au premier client : un parcours simplifié pour se lancer.", "Destiné aux jeunes porteurs de projet, ce guide reprend les étapes clés pour structurer une idée et passer à l'action.", "", "2026-07-01", "", "Ressources", "Télécharger", "telechargement", "", "OUI", "8", "Format PDF · 18 pages"],
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY manquants dans l'environnement.");
  }
  const key = rawKey.replace(/\\n/g, "\n");
  return new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
}

async function ensureSheet(sheets, spreadsheetId, existingTitles, title) {
  if (existingTitles.includes(title)) {
    console.log(`  - Onglet "${title}" déjà présent.`);
    return;
  }
  console.log(`  - Création de l'onglet "${title}"...`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
}

async function ensureHeaders(sheets, spreadsheetId, title, headers) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${title}!A1:1` });
  const firstRow = res.data.values?.[0] ?? [];
  if (firstRow.length > 0) {
    console.log(`  - En-têtes déjà présents dans "${title}".`);
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  console.log(`  - En-têtes écrits dans "${title}".`);
}

async function ensureSeedData(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Contenus!A2:A" });
  const rows = res.data.values ?? [];
  if (rows.length > 0) {
    console.log("  - Contenus déjà rempli, pas de seed.");
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Contenus!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: SEED_ROWS },
  });
  console.log(`  - ${SEED_ROWS.length} lignes de démonstration ajoutées dans "Contenus".`);
}

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_CONTENT_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_CONTENT_ID manquant dans l'environnement.");

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  console.log(`Lecture du classeur ${spreadsheetId}...`);
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = meta.data.sheets.map((s) => s.properties.title);
  console.log(`Onglets existants : ${existingTitles.join(", ") || "(aucun)"}`);

  await ensureSheet(sheets, spreadsheetId, existingTitles, "Contenus");
  await ensureSheet(sheets, spreadsheetId, existingTitles, "Prospects");
  await ensureSheet(sheets, spreadsheetId, existingTitles, "Evenements");

  await ensureHeaders(sheets, spreadsheetId, "Contenus", CONTENT_HEADERS);
  await ensureHeaders(sheets, spreadsheetId, "Prospects", PROSPECTS_HEADERS);
  await ensureHeaders(sheets, spreadsheetId, "Evenements", EVENEMENTS_HEADERS);

  await ensureSeedData(sheets, spreadsheetId);

  console.log("\nTerminé. Le classeur est prêt.");
}

main().catch((err) => {
  console.error("\nErreur :", err.message);
  if (err.message?.includes("PERMISSION_DENIED") || err.code === 403) {
    console.error(
      "\nLe compte de service n'a probablement pas accès à ce classeur.\n" +
        "Partagez le Google Sheet avec l'email du compte de service (rôle Éditeur) puis relancez ce script."
    );
  }
  process.exit(1);
});
