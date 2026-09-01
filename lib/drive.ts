import { google } from "googleapis";
import { getGoogleAuth } from "./google-auth";

function getDriveClient() {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google Drive n'est pas configuré (identifiants manquants).");
  return google.drive({ version: "v3", auth });
}

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

/**
 * Liste les fichiers déjà présents dans le dossier Drive partagé — permet de
 * réutiliser une image/un fichier déjà importé plutôt que d'en renvoyer un
 * nouveau depuis l'ordinateur. Aucun OAuth utilisateur nécessaire : le
 * compte de service a déjà accès au dossier (partagé en Éditeur).
 */
export async function listDriveFiles(kind: "image" | "document"): Promise<DriveFileSummary[]> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return [];

  const mimeFilter = kind === "image" ? " and mimeType contains 'image/'" : "";
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false${mimeFilter}`,
    fields: "files(id, name, mimeType)",
    orderBy: "createdTime desc",
    pageSize: 60,
  });

  return (res.data.files ?? [])
    .filter((f): f is { id: string; name: string; mimeType: string } => Boolean(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name ?? f.id,
      mimeType: f.mimeType ?? "",
      url: kind === "image" ? driveImageUrl(f.id) : driveFileUrl(f.id),
    }));
}

export function driveImageUrl(fileId: string): string {
  // Rendu fiable comme <img>/next-image src (contrairement à uc?export=view,
  // souvent bloqué en hotlinking) ; redimensionné côté Google.
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
