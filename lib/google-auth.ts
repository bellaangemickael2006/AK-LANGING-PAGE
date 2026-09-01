import { google } from "googleapis";

/**
 * Authentification Google partagée par Sheets (contenu + mini-CRM) et Drive
 * (upload d'images/fichiers) : un seul compte de service, un seul jeu de
 * scopes. drive.file limite l'accès aux seuls fichiers créés par cette
 * application (pas d'accès au reste du Drive du compte).
 */
export function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  const key = rawKey.replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}
