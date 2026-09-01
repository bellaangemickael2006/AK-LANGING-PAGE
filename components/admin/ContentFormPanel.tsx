"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ContentItem, ContentType, CtaAction } from "@/lib/types";
import type { DriveFileSummary } from "@/lib/drive";

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "actualite", label: "Actualité" },
  { value: "promotion", label: "Offre limitée / promotion" },
  { value: "formation", label: "Formation" },
  { value: "ebook", label: "Ebook" },
  { value: "article", label: "Ressource / article" },
];

const CTA_OPTIONS: { value: CtaAction; label: string }[] = [
  { value: "info", label: "Information (pas de capture)" },
  { value: "inscription", label: "Inscription (formation)" },
  { value: "telechargement", label: "Téléchargement (ebook)" },
];

const EMPTY: ContentItem = {
  id: "",
  type: "actualite",
  titre: "",
  chapo: "",
  corps: "",
  imageUrl: "",
  datePublication: new Date().toISOString().slice(0, 10),
  dateFin: "",
  departement: "",
  ctaLabel: "En savoir plus",
  ctaAction: "info",
  fichierUrl: "",
  visible: true,
  ordre: 100,
  infosPratiques: "",
};

export function ContentFormPanel({
  initial,
  onClose,
  onSaved,
}: {
  initial: ContentItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<ContentItem>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(initial);

  function set<K extends keyof ContentItem>(key: K, value: ContentItem[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(isEditing ? `/api/admin/contenus/${values.id}` : "/api/admin/contenus", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Erreur lors de l'enregistrement.");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("Impossible de joindre le serveur.");
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-ak-line/10 bg-ak-charcoal p-6 sm:p-8"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ak-white">
            {isEditing ? "Modifier le contenu" : "Nouveau contenu"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-ak-silver hover:text-ak-white">
            ✕
          </button>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          <Row label="Type">
            <select
              value={values.type}
              onChange={(e) => set("type", e.target.value as ContentType)}
              className={selectClass}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Titre *">
            <input required value={values.titre} onChange={(e) => set("titre", e.target.value)} className={inputClass} />
          </Row>

          <Row label="Chapô (résumé court)">
            <textarea
              value={values.chapo}
              onChange={(e) => set("chapo", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Row>

          <Row label="Corps (texte complet)">
            <textarea
              value={values.corps}
              onChange={(e) => set("corps", e.target.value)}
              rows={4}
              className={inputClass}
            />
          </Row>

          <Row label="Département / rubrique">
            <input value={values.departement} onChange={(e) => set("departement", e.target.value)} className={inputClass} />
          </Row>

          <Row label="Infos pratiques (durée, lieu, format...)">
            <input
              value={values.infosPratiques}
              onChange={(e) => set("infosPratiques", e.target.value)}
              className={inputClass}
            />
          </Row>

          <div className="grid grid-cols-2 gap-4">
            <Row label="Date de publication">
              <input
                type="date"
                value={values.datePublication}
                onChange={(e) => set("datePublication", e.target.value)}
                className={inputClass}
              />
            </Row>
            <Row label="Date de fin (optionnelle)">
              <input type="date" value={values.dateFin} onChange={(e) => set("dateFin", e.target.value)} className={inputClass} />
            </Row>
          </div>

          <Row label="Image">
            <UploadField
              kind="image"
              value={values.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              placeholder="https:// ou importez un fichier"
            />
          </Row>

          <Row label="Bouton d'action">
            <select
              value={values.ctaAction}
              onChange={(e) => set("ctaAction", e.target.value as CtaAction)}
              className={selectClass}
            >
              {CTA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Texte du bouton">
            <input value={values.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={inputClass} />
          </Row>

          {values.ctaAction === "telechargement" && (
            <Row label="Fichier à télécharger (PDF...)">
              <UploadField
                kind="document"
                value={values.fichierUrl}
                onChange={(v) => set("fichierUrl", v)}
                placeholder="https:// ou importez un fichier"
              />
            </Row>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Row label="Ordre d'affichage">
              <input
                type="number"
                value={values.ordre}
                onChange={(e) => set("ordre", Number(e.target.value))}
                className={inputClass}
              />
            </Row>
            <Row label="Visible sur le site">
              <label className="flex h-full items-center gap-2 text-sm text-ak-silver">
                <input
                  type="checkbox"
                  checked={values.visible}
                  onChange={(e) => set("visible", e.target.checked)}
                  className="h-4 w-4 accent-[var(--ak-blue)]"
                />
                Publié
              </label>
            </Row>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-full bg-ak-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : isEditing ? "Enregistrer les modifications" : "Créer le contenu"}
        </button>
      </motion.form>
    </motion.div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ak-line/10 bg-ak-black/60 px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue";
const selectClass = inputClass;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">{label}</span>
      {children}
    </label>
  );
}

function UploadField({
  kind,
  value,
  onChange,
  placeholder,
}: {
  kind: "image" | "document";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[] | null>(null);
  const [browseError, setBrowseError] = useState("");
  const inputId = `upload-${kind}-${Math.random().toString(36).slice(2, 8)}`;

  async function openBrowser() {
    setBrowsing(true);
    setBrowseError("");
    if (driveFiles === null) {
      try {
        const res = await fetch(`/api/admin/drive-files?kind=${kind}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setBrowseError(data.error || "Impossible de charger les fichiers Drive.");
          setDriveFiles([]);
          return;
        }
        setDriveFiles(data.files);
      } catch {
        setBrowseError("Impossible de joindre le serveur.");
        setDriveFiles([]);
      }
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.error || "Échec de l'envoi.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Impossible de joindre le serveur.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass + " min-w-[10rem] flex-1"}
        />
        <label
          htmlFor={inputId}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-ak-line/10 px-3 text-xs font-semibold text-ak-white transition-colors hover:border-ak-blue/50 hover:bg-ak-blue/10"
        >
          {uploading ? "Envoi…" : "Depuis mon PC"}
        </label>
        <input
          id={inputId}
          type="file"
          accept={kind === "image" ? "image/*" : undefined}
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={openBrowser}
          className="flex shrink-0 items-center justify-center rounded-lg border border-ak-line/10 px-3 text-xs font-semibold text-ak-white transition-colors hover:border-ak-blue/50 hover:bg-ak-blue/10"
        >
          Depuis Drive
        </button>
      </div>
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}

      <AnimatePresence>
        {browsing && (
          <>
            <motion.div
              className="fixed inset-0 z-[110]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBrowsing(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-72 overflow-y-auto rounded-xl border border-ak-line/10 bg-ak-charcoal p-3 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.4)]"
            >
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ak-silver">
                Fichiers déjà dans le Drive du site
              </p>
              {driveFiles === null && <p className="text-xs text-ak-silver-dim">Chargement…</p>}
              {browseError && <p className="text-xs text-red-400">{browseError}</p>}
              {driveFiles !== null && driveFiles.length === 0 && !browseError && (
                <p className="text-xs text-ak-silver-dim">Aucun fichier importé pour l'instant.</p>
              )}
              {kind === "image" ? (
                <div className="grid grid-cols-4 gap-2">
                  {driveFiles?.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onChange(f.url);
                        setBrowsing(false);
                      }}
                      title={f.name}
                      className="overflow-hidden rounded-lg border border-ak-line/10 transition-colors hover:border-ak-blue"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatures Drive dans un popover admin */}
                      <img src={f.url} alt={f.name} className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {driveFiles?.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onChange(f.url);
                        setBrowsing(false);
                      }}
                      className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs text-ak-white hover:bg-ak-blue/10"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {kind === "image" && value && (
        // eslint-disable-next-line @next/next/no-img-element -- aperçu admin, source externe arbitraire (URL collée ou Drive)
        <img src={value} alt="Aperçu" className="h-20 w-32 rounded-lg border border-ak-line/10 object-cover" />
      )}
      {kind === "document" && value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-ak-blue-bright underline">
          Voir le fichier actuel
        </a>
      )}
    </div>
  );
}
