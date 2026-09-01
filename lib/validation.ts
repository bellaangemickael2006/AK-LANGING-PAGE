const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Garde uniquement les chiffres et retire les préfixes internationaux
 * courants pour la Côte d'Ivoire (+225 / 00225), afin de comparer deux
 * numéros écrits différemment lors de la déduplication.
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00225")) digits = digits.slice(5);
  else if (digits.startsWith("225") && digits.length > 10) digits = digits.slice(3);
  if (digits.startsWith("0") && digits.length > 10) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 8 && digits.length <= 13;
}
