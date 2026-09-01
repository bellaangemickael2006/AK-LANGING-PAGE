// Pur (aucune dépendance Node/serveur) — utilisé à la fois côté serveur
// (lib/newsletter.ts, pour l'envoi réel) et côté client (aperçu en direct
// dans le tableau de bord) : même rendu garanti entre les deux.

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function buildNewsletterHtml({
  message,
  imageUrls,
  unsubscribeUrl,
}: {
  message: string;
  imageUrls: string[];
  unsubscribeUrl: string;
}): string {
  const paragraphs = message
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#1a1f2b;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const images = imageUrls
    .filter(Boolean)
    .map(
      (url) =>
        `<img src="${escapeHtml(url)}" alt="AK World Business Services" style="max-width:100%;width:100%;border-radius:8px;margin:0 0 16px;display:block;" />`
    )
    .join("");

  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
  <p style="font-weight:bold;font-size:16px;color:#101c47;margin:0 0 20px;">AK World Business Services</p>
  ${images}
  ${paragraphs}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:12px;color:#6b7385;line-height:1.5;">
    Vous recevez cet email car vous avez été en contact avec AK World Business Services.
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#2451ff;">Se désabonner</a>
  </p>
</div>`.trim();
}
