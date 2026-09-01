import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
}

/**
 * Stockage local pour le développement : le fichier importé est écrit dans
 * public/uploads et servi directement par Next.js, sans dépendance externe.
 * Une fois le site déployé sur Vercel, ce disque n'est plus persistant
 * (fonctions serverless) — il faudra alors brancher Vercel Blob Storage ici
 * (un simple token à ajouter, aucune configuration côté visiteur/cabinet).
 */
export async function saveLocalFile(buffer: Buffer, originalFilename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFilename(originalFilename)}`;
  await writeFile(path.join(UPLOAD_DIR, unique), buffer);
  return `/uploads/${unique}`;
}
