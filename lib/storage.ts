import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
}

/**
 * Certains fichiers (export d'un outil, image sauvegardée depuis un site,
 * renommage manuel) ont une extension qui ne correspond pas à leur contenu
 * réel — ex. un fichier réellement encodé en WebP mais nommé "photo.png".
 * Le navigateur se fie souvent à l'extension pour deviner le type, donc s'y
 * fier aveuglément fait stocker un contenu image/webp sous Content-Type
 * image/png, ce que l'optimiseur d'images de Next.js refuse ensuite de
 * traiter (erreur 400). On vérifie donc la signature binaire réelle et on
 * la fait primer sur le type déclaré par le client.
 */
function sniffImageMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function resolveMimeType(buffer: Buffer, declaredMimeType: string): string {
  const sniffed = sniffImageMimeType(buffer);
  return sniffed ?? declaredMimeType;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/**
 * Renomme l'extension du nom de fichier pour qu'elle corresponde au type
 * réellement détecté, plutôt que de conserver une extension trompeuse
 * (ex. "photo.png" contenant en réalité du WebP).
 */
function withCorrectExtension(originalFilename: string, resolvedMimeType: string): string {
  const correctExt = EXTENSION_BY_MIME[resolvedMimeType];
  if (!correctExt) return originalFilename;
  const base = originalFilename.replace(/\.[a-zA-Z0-9]+$/, "");
  return `${base}.${correctExt}`;
}

/**
 * Stockage local (public/uploads) : suffisant en développement, mais le
 * disque d'une fonction serverless Vercel n'est pas persistant entre deux
 * requêtes — inutilisable une fois déployé.
 */
async function saveToLocalDisk(buffer: Buffer, originalFilename: string, resolvedMimeType: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = withCorrectExtension(originalFilename, resolvedMimeType);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFilename(filename)}`;
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
  const resolvedMimeType = resolveMimeType(buffer, mimeType);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const filename = withCorrectExtension(originalFilename, resolvedMimeType);
    const unique = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFilename(filename)}`;
    const blob = await put(unique, buffer, {
      access: "public",
      contentType: resolvedMimeType,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  return saveToLocalDisk(buffer, originalFilename, resolvedMimeType);
}
