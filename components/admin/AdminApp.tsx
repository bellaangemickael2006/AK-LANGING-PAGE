"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ContentItem, ContentType } from "@/lib/types";
import { ContentFormPanel } from "./ContentFormPanel";

const TYPE_TABS: { key: "tous" | ContentType; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "actualite", label: "Actualités" },
  { key: "promotion", label: "Offres" },
  { key: "formation", label: "Formations" },
  { key: "ebook", label: "Ebooks" },
  { key: "article", label: "Ressources" },
];

const TYPE_LABEL: Record<ContentType, string> = {
  actualite: "Actualité",
  promotion: "Offre limitée",
  formation: "Formation",
  ebook: "Ebook",
  article: "Ressource",
};

export function AdminApp() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"tous" | ContentType>("tous");
  const [editing, setEditing] = useState<ContentItem | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/admin/contenus", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Erreur de chargement.");
        return;
      }
      setItems(data.items);
    } catch {
      setError("Impossible de joindre le serveur.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const list = activeTab === "tous" ? items : items.filter((i) => i.type === activeTab);
    return [...list].sort((a, b) => a.ordre - b.ordre);
  }, [items, activeTab]);

  async function handleToggleVisible(item: ContentItem) {
    setBusyId(item.id);
    const updated = { ...item, visible: !item.visible };
    setItems((prev) => prev?.map((i) => (i.id === item.id ? updated : i)) ?? prev);
    await fetch(`/api/admin/contenus/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setBusyId(null);
  }

  async function handleDelete(item: ContentItem) {
    if (!window.confirm(`Supprimer définitivement « ${item.titre} » ?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/contenus/${item.id}`, { method: "DELETE" });
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
    setBusyId(null);
  }

  async function handleSaved() {
    setEditing(null);
    await load();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ak-black">
      <header className="sticky top-0 z-30 border-b border-ak-line/8 bg-ak-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo_ak_world.png" alt="AK World" width={32} height={32} className="rounded-md" />
            <span className="text-sm font-semibold text-ak-white">Administration du contenu</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
            <a href="/admin/newsletter" className="whitespace-nowrap text-sm font-medium text-ak-silver hover:text-ak-white">
              Newsletter
            </a>
            <a href="/admin/settings" className="whitespace-nowrap text-sm font-medium text-ak-silver hover:text-ak-white">
              Réglages
            </a>
            <a href="/" target="_blank" className="whitespace-nowrap text-sm font-medium text-ak-silver hover:text-ak-white">
              Voir le site ↗
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

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-ak-blue text-white"
                    : "bg-ak-line/5 text-ak-silver hover:bg-ak-line/10 hover:text-ak-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditing("new")}
            className="rounded-full bg-ak-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ak-blue-bright"
          >
            + Ajouter un contenu
          </button>
        </div>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {!items && !error && <p className="mt-10 text-sm text-ak-silver">Chargement…</p>}

        {items && filtered.length === 0 && (
          <p className="mt-10 text-sm text-ak-silver-dim">Aucun contenu dans cette catégorie.</p>
        )}

        <div className="mt-6 space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-ak-line/8 bg-ak-charcoal p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ak-blue/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ak-blue-bright">
                    {TYPE_LABEL[item.type]}
                  </span>
                  {!item.visible && (
                    <span className="rounded-full bg-ak-line/8 px-2.5 py-0.5 text-[11px] font-medium text-ak-silver-dim">
                      Masqué
                    </span>
                  )}
                  <span className="text-xs text-ak-silver-dim">ordre {item.ordre}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-ak-white">{item.titre}</p>
                <p className="truncate text-xs text-ak-silver">{item.chapo}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-ak-silver">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    disabled={busyId === item.id}
                    onChange={() => handleToggleVisible(item)}
                    className="h-4 w-4 accent-[var(--ak-blue)]"
                  />
                  Visible
                </label>
                <button
                  onClick={() => setEditing(item)}
                  className="rounded-full border border-ak-line/10 px-3.5 py-1.5 text-xs font-medium text-ak-white hover:border-ak-blue/50 hover:bg-ak-line/5"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={busyId === item.id}
                  className="rounded-full border border-red-500/30 px-3.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {editing && (
          <ContentFormPanel
            key="panel"
            initial={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
