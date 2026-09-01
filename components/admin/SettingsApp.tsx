"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsApp() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Échec du changement de mot de passe.");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ak-black">
      <header className="sticky top-0 z-30 border-b border-ak-line/8 bg-ak-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo_ak_world.png" alt="AK World" width={32} height={32} className="rounded-md" />
            <span className="text-sm font-semibold text-ak-white">Réglages</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
            <a href="/admin" className="whitespace-nowrap text-sm font-medium text-ak-silver hover:text-ak-white">
              ← Contenu
            </a>
            <a href="/admin/newsletter" className="whitespace-nowrap text-sm font-medium text-ak-silver hover:text-ak-white">
              Newsletter
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

      <main className="mx-auto max-w-md px-5 py-10 sm:px-8">
        <h1 className="text-lg font-semibold text-ak-white">Changer le mot de passe administrateur</h1>
        <p className="mt-1.5 text-sm text-ak-silver-dim">
          Ce mot de passe protège l&rsquo;accès à tout le tableau de bord (contenus et newsletter).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
              Mot de passe actuel
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
            />
            <p className="mt-1.5 text-xs text-ak-silver-dim">8 caractères minimum.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-ak-line/10 bg-ak-charcoal px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">Mot de passe mis à jour avec succès.</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ak-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Enregistrement…" : "Changer le mot de passe"}
          </button>
        </form>
      </main>
    </div>
  );
}
