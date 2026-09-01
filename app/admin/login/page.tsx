"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Mot de passe incorrect.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Impossible de joindre le serveur.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ak-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-ak-line/10 bg-ak-charcoal p-8"
      >
        <div className="flex flex-col items-center text-center">
          <Image src="/logo_ak_world.png" alt="AK World" width={56} height={56} className="rounded-xl" />
          <h1 className="mt-4 text-lg font-semibold text-ak-white">Espace administration</h1>
          <p className="mt-1 text-sm text-ak-silver">AK World Business Services</p>
        </div>

        <label className="mt-8 block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ak-silver">
            Mot de passe
          </span>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ak-line/10 bg-ak-black/60 px-3.5 py-2.5 text-sm text-ak-white outline-none focus:border-ak-blue"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-ak-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
