"use client";

import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from "./upload-constants";

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Envoie un fichier vers /api/admin/upload. Vérifie la taille AVANT
 * l'envoi (Vercel refuse au niveau plateforme au-delà de 4,5 Mo, sans
 * jamais atteindre notre code — un contrôle après coup ne peut pas
 * intercepter ce cas). Gère aussi une réponse qui ne serait pas du JSON
 * (ex. page d'erreur de la plateforme) sans planter avec un message
 * trompeur.
 */
export async function uploadFile(file: File, extraFields?: Record<string, string>): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_SIZE) {
    return { ok: false, error: `Fichier trop volumineux (${MAX_UPLOAD_SIZE_LABEL} maximum).` };
  }

  const formData = new FormData();
  formData.append("file", file);
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) formData.append(key, value);
  }

  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  } catch {
    return { ok: false, error: "Impossible de joindre le serveur." };
  }

  let data: UploadResult | null = null;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: res.status === 413 ? `Fichier trop volumineux (${MAX_UPLOAD_SIZE_LABEL} maximum).` : "Réponse inattendue du serveur.",
    };
  }

  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || "Échec de l'envoi." };
  }
  return { ok: true, url: data.url };
}
