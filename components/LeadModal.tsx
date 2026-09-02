"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { LeadModalConfig } from "./LeadModalContext";

const STORAGE_KEY = "ak_lead_profile";

interface StoredProfile {
  nom: string;
  profession: string;
  activite: string;
  telephone: string;
  email: string;
}

type Status = "form" | "submitting" | "success" | "error";

export function LeadModal({
  config,
  onClose,
}: {
  config: LeadModalConfig | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<StoredProfile>({
    nom: "",
    profession: "",
    activite: "",
    telephone: "",
    email: "",
  });

  useEffect(() => {
    if (!config) return;
    setStatus("form");
    setErrorMessage("");
    setFieldErrors({});
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setValues(JSON.parse(raw));
    } catch {
      // localStorage indisponible (navigation privée) — on continue avec un formulaire vide
    }
  }, [config]);

  if (!config) return null;

  function handleChange(field: keyof StoredProfile, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config) return;

    const honeypot = (e.currentTarget.elements.namedItem("societe_web") as HTMLInputElement)?.value;

    const errors: Record<string, string> = {};
    if (!isValidEmail(values.email)) errors.email = "Adresse email invalide.";
    if (!isValidPhone(values.telephone)) errors.telephone = "Numéro de téléphone invalide.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          honeypot,
          type: config.action,
          itemId: config.itemId,
          itemTitre: config.itemTitre,
          departement: config.departement,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Une erreur est survenue. Réessayez dans un instant.");
        setStatus("error");
        return;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch {
        // pas grave si indisponible
      }
      setStatus("success");
      config.onSuccess?.();
    } catch {
      setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            className="relative w-full max-w-md rounded-2xl border border-ak-line/10 bg-ak-charcoal p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(36,81,255,0.35)]"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ak-silver transition-colors hover:bg-ak-line/5 hover:text-ak-white"
            >
              ✕
            </button>

            {status === "success" ? (
              <div className="pt-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ak-blue/15 text-ak-blue-bright">
                  ✓
                </div>
                <h3 id="lead-modal-title" className="text-xl font-semibold text-ak-white">
                  Merci, votre demande est enregistrée
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ak-silver">
                  {config.action === "inscription" &&
                    `Votre inscription à « ${config.itemTitre} » a bien été prise en compte. Le cabinet vous contactera prochainement.`}
                  {config.action === "telechargement" &&
                    (config.fichierUrl
                      ? `Voici votre lien de téléchargement pour « ${config.itemTitre} ».`
                      : `Votre demande pour « ${config.itemTitre} » est enregistrée. Le document vous sera transmis par le cabinet.`)}
                  {config.action === "info" &&
                    `Votre demande d'information sur « ${config.itemTitre} » a bien été transmise au cabinet.`}
                </p>
                {config.action === "telechargement" && config.fichierUrl && (
                  <a
                    href={config.fichierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-ak-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright"
                  >
                    Télécharger le document
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="mt-5 block text-sm font-medium text-ak-silver underline-offset-4 hover:text-ak-white hover:underline"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="pt-2">
                <h3 id="lead-modal-title" className="text-xl font-semibold text-ak-white">
                  {config.ctaLabel}
                </h3>
                <p className="mt-1 text-sm text-ak-silver">{config.itemTitre}</p>

                <div className="mt-6 space-y-4">
                  <Field label="Nom" value={values.nom} onChange={(v) => handleChange("nom", v)} autoComplete="name" />
                  <Field
                    label="Profession"
                    value={values.profession}
                    onChange={(v) => handleChange("profession", v)}
                    autoComplete="organization-title"
                  />
                  <Field
                    label="Activité"
                    value={values.activite}
                    onChange={(v) => handleChange("activite", v)}
                    autoComplete="organization"
                  />
                  <Field
                    label="Téléphone"
                    required
                    type="tel"
                    value={values.telephone}
                    onChange={(v) => handleChange("telephone", v)}
                    autoComplete="tel"
                    error={fieldErrors.telephone}
                  />
                  <Field
                    label="Email"
                    required
                    type="email"
                    value={values.email}
                    onChange={(v) => handleChange("email", v)}
                    autoComplete="email"
                    error={fieldErrors.email}
                  />

                  {/* Honeypot anti-spam : champ caché, jamais rempli par un humain */}
                  <input
                    type="text"
                    name="societe_web"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="mt-4 text-sm text-red-400">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-6 flex w-full items-center justify-center rounded-full bg-ak-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Envoi en cours…" : "Valider"}
                </button>
                <p className="mt-3 text-center text-xs text-ak-silver-dim">
                  Vos informations sont transmises uniquement à AK World Business Services.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
        {label}
        {required && <span className="text-ak-blue-bright"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ak-line/10 bg-ak-black/60 px-3.5 py-2.5 text-sm text-ak-white outline-none transition-colors placeholder:text-ak-silver-dim focus:border-ak-blue"
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
