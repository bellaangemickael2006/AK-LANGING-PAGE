import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
}

/**
 * Stockage local (public/uploads) : suffisant en développement, mais le
 * disque d'une fonction serverless Vercel n'est pas persistant entre deux
 * requêtes — inutilisable une fois déployé.
 */
async function saveToLocalDisk(buffer: Buffer, originalFilename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFilename(originalFilename)}`;
  await writeFile(path.join(UPLOAD_DIR, unique), buffer);
  return `/uploads/${unique}`;
}

/**
 * Enregistre un fichier importé et retourne son URL publique.
 * - En production (Vercel) avec un Blob Store connecté (BLOB_READ_WRITE_TOKEN
 *   injecté automatiquement) : envoi vers Vercel Blob, URL publique
 *   permanente (utilisable telle quelle, y compris dans les emails de la
 *   newsletter).
 * - Sinon (développement local) : écriture sur disque dans public/uploads.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const unique = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFilename(originalFilename)}`;
    const blob = await put(unique, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  return saveToLocalDisk(buffer, originalFilename);
}
