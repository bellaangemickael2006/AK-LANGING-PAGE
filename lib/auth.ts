// Utilise l'API Web Crypto (crypto.subtle), disponible à la fois côté Node
// et dans l'Edge Runtime utilisé par middleware.ts — le module Node "crypto"
// classique n'est pas supporté par le middleware Next.js.

export const ADMIN_COOKIE_NAME = "ak_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "ak-world-dev-secret";
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionCookieValue(): Promise<string> {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function isValidSessionCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const idx = value.lastIndexOf(".");
  if (idx === -1) return false;
  const payload = value.slice(0, idx);
  const signature = value.slice(idx + 1);
  const expected = await sign(payload);
  if (expected.length !== signature.length) return false;

  const issuedAt = Number(payload.split(".")[1]);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;

export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
