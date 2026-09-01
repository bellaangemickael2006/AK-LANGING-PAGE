import nodemailer from "nodemailer";
import { LeadActionType } from "./types";

export function isMailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

const SUBJECT_BY_TYPE: Record<LeadActionType, string> = {
  inscription: "Votre inscription — AK World Business Services",
  telechargement: "Votre demande de document — AK World Business Services",
  info: "Votre demande d'information — AK World Business Services",
};

function bodyByType(type: LeadActionType, itemTitre: string): string {
  switch (type) {
    case "inscription":
      return `Bonjour,\n\nNous avons bien reçu votre inscription à « ${itemTitre} ».\nLe cabinet AK World Business Services va examiner votre demande et reviendra vers vous pour confirmer votre place.\n\nÀ très bientôt,\nAK World Business Services`;
    case "telechargement":
      return `Bonjour,\n\nNous avons bien reçu votre demande pour « ${itemTitre} ».\nLe cabinet AK World Business Services valide chaque demande avant l'envoi du document ; vous le recevrez très prochainement.\n\nÀ très bientôt,\nAK World Business Services`;
    case "info":
    default:
      return `Bonjour,\n\nNous avons bien reçu votre demande d'information concernant « ${itemTitre} ».\nUn membre du cabinet AK World Business Services reviendra vers vous prochainement.\n\nÀ très bientôt,\nAK World Business Services`;
  }
}

/**
 * Envoie un email de confirmation au prospect après une inscription /
 * demande de téléchargement / demande d'info. Best-effort : une erreur ici
 * ne doit jamais faire échouer la capture du lead elle-même (déjà en
 * sécurité dans Google Sheets à ce stade) — on journalise et on continue.
 */
export async function sendConfirmationEmail(to: string, type: LeadActionType, itemTitre: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"AK World Business Services" <${process.env.GMAIL_USER}>`,
      to,
      subject: SUBJECT_BY_TYPE[type],
      text: bodyByType(type, itemTitre),
    });
  } catch (error) {
    console.error("[mail] Échec de l'envoi de l'email de confirmation:", error);
  }
}
