"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildNewsletterHtml } from "@/lib/newsletter-template";

interface Recipient {
  email: string;
  nom: string;
  token: string;
}

const RECIPIENT_WARNING_THRESHOLD = 300;

export function NewsletterApp() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [mode, setMode] = useState<"tous" | "mot-cle">("tous");
  const [keyword, setKeyword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [failures, setFailures] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const cleanImageUrls = useMemo(() => imageUrls.map((u) => u.trim()).filter(Boolean), [imageUrls]);
  const previewHtml = useMemo(
    () =>
      buildNewsletterHtml({
        message: message || "Votre message apparaîtra ici.",
        imageUrls: cleanImageUrls,
        unsubscribeUrl: "#",
      }),
    [message, cleanImageUrls]
  );

  async function handleUploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.error || "Échec de l'envoi.");
        return;
      }
      setImageUrls((prev) => {
        const withoutEmptyTrailing = prev.filter((u) => u.trim());
        return [...withoutEmptyTrailing, data.url];
      });
    } catch {
      setUploadError("Impossible de joindre le serveur.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCheckRecipients() {
    setChecking(true);
    setCheckError("");
    setRecipients(null);
    try {
      const url =
        mode === "mot-cle" && keyword.trim()
          ? `/api/admin/newsletter/recipients?keyword=${encodeURIComponent(keyword.trim())}`
          : "/api/admin/newsletter/recipients";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCheckError(data.error || "Erreur lors de la vérification.");
        return;
      }
      setRecipients(data.recipients);
    } catch {
      setCheckError("Impossible de joindre le serveur.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSend() {
    if (!recipients || recipients.length === 0) return;
    const confirmed = window.confirm(
      `Envoyer cet email à ${recipients.length} destinataire(s) ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setSending(true);
    setDone(false);
    setFailures([]);
    setProgress({ sent: 0, total: recipients.length });

    const failedEmails: string[] = [];
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      try {
        const res = await fetch("/api/admin/newsletter/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: r.email, subject, message, imageUrls: cleanImageUrls, token: r.token }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) failedEmails.push(r.email);
      } catch {
        failedEmails.push(r.email);
      }
      setProgress({ sent: i + 1, total: recipients.length });
      if (i < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    setFailures(failedEmails);
    setSending(false);
    setDone(true);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const overThreshold = (recipients?.length ?? 0) > RECIPIENT_WARNING_THRESHOLD;

  return (
    <div className="min-h-screen bg-ak-black">
      <header className="sticky top-0 z-30 border-b border-ak-line/8 bg-ak-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo_ak_world.png" alt="AK World" width={32} height={32} className="rounded-md" />
            <span className="text-sm font-semibold text-ak-white">Newsletter</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm font-medium text-ak-silver hover:text-ak-white">
              ← Contenu
            </a>
            <button
              onClick={handleLogout}
              className="rounded-full border border-ak-line/10 px-4 py-1.5 text-sm font-medium text-ak-silver transition-colors hover:border-ak-line/25 hover:text-ak-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">Sujet</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
              placeholder="Ex. : Nos actualités du mois"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
              placeholder="Votre texte (un saut de ligne vide sépare les paragraphes)"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
              Image(s) — URL absolue déjà hébergée publiquement (Drive, Imgur…)
            </label>
            <p className="mb-2 text-xs text-ak-silver-dim">
              Doit commencer par https:// et être accessible sans connexion — un chemin local (/uploads/...) ne
              s&rsquo;affichera pas dans l&rsquo;email du destinataire.
            </p>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => setImageUrls((prev) => prev.map((u, idx) => (idx === i ? e.target.value : u)))}
                    className="flex-1 rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
                    placeholder="https://..."
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-lg border border-ak-line/10 px-3 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setImageUrls((prev) => [...prev, ""])}
                className="text-xs font-semibold text-ak-blue-bright hover:underline"
              >
                + Ajouter une image
              </button>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="newsletter-image-upload"
                  className="inline-flex cursor-pointer items-center rounded-lg border border-ak-line/10 px-3 py-1.5 text-xs font-semibold text-ak-white transition-colors hover:border-ak-blue/50 hover:bg-ak-blue/10"
                >
                  {uploading ? "Envoi…" : "Importer depuis mon PC"}
                </label>
                <input
                  id="newsletter-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
              Destinataires
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("tous")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${mode === "tous" ? "bg-ak-blue text-white" : "bg-ak-line/5 text-ak-silver"}`}
              >
                Tous les contacts
              </button>
              <button
                type="button"
                onClick={() => setMode("mot-cle")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${mode === "mot-cle" ? "bg-ak-blue text-white" : "bg-ak-line/5 text-ak-silver"}`}
              >
                Filtrer par intérêt
              </button>
            </div>
            {mode === "mot-cle" && (
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
                placeholder="Ex. : Formation professionnelle"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckRecipients}
            disabled={checking}
            className="rounded-full border border-ak-line/10 px-5 py-2.5 text-sm font-semibold text-ak-white hover:border-ak-blue/50 disabled:opacity-60"
          >
            {checking ? "Vérification…" : "Vérifier les destinataires"}
          </button>
          {checkError && <p className="text-sm text-red-400">{checkError}</p>}
          {recipients && (
            <p className="text-sm text-ak-silver">
              <strong className="text-ak-white">{recipients.length}</strong> destinataire(s) concerné(s).
            </p>
          )}
          {overThreshold && (
            <p className="rounded-lg border border-ak-gold/30 bg-ak-gold/10 px-3.5 py-2.5 text-xs text-ak-gold">
              Plus de {RECIPIENT_WARNING_THRESHOLD} destinataires : un Gmail personnel risque d&rsquo;être classé
              comme spam au-delà de ce volume. Voir le README pour envisager un service d&rsquo;envoi dédié.
            </p>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!recipients || recipients.length === 0 || !subject || !message || sending}
            className="w-full rounded-full bg-ak-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? `Envoi… ${progress.sent} / ${progress.total}` : "Envoyer"}
          </button>

          {done && (
            <div className="rounded-lg border border-ak-line/10 bg-ak-charcoal p-4 text-sm">
              <p className="text-ak-white">
                Terminé : {progress.total - failures.length} / {progress.total} envoyés avec succès.
              </p>
              {failures.length > 0 && (
                <p className="mt-2 text-red-400">Échecs ({failures.length}) : {failures.join(", ")}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ak-silver">
            Aperçu de l&rsquo;email (rendu réel pour le destinataire)
          </p>
          <div className="overflow-hidden rounded-2xl border border-ak-line/10 bg-white">
            <iframe title="Aperçu email" className="h-[600px] w-full" srcDoc={previewHtml} />
          </div>
        </div>
      </main>
    </div>
  );
}
