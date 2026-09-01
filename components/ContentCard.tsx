"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ContentItem } from "@/lib/types";
import { TiltCard } from "./TiltCard";
import { useLeadModal } from "./LeadModalContext";

const TYPE_LABEL: Record<ContentItem["type"], string> = {
  actualite: "Actualité",
  promotion: "Offre limitée",
  formation: "Formation",
  ebook: "Ebook",
  article: "Ressource",
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Motif abstrait animé remplaçant une photo (aucune image de démonstration
 * générique) : un halo bleu qui respire doucement + une grille fine, cohérent
 * avec l'identité "AK" sans dépendre d'une image_url encore vide.
 */
function AbstractMotif({ gold }: { gold?: boolean }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-ak-line/5 bg-gradient-to-br from-ak-charcoal-2 to-ak-black">
      <motion.div
        className="absolute -right-6 -top-8 h-28 w-28 rounded-full blur-2xl"
        style={{ background: gold ? "var(--ak-gold)" : "var(--ak-blue)" }}
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(var(--ak-grid-rgb),0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--ak-grid-rgb),0.6) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}

export function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  const { open } = useLeadModal();
  const isPromo = item.type === "promotion";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.7, delay: (index % 3) * 0.12 }}
      className="group"
    >
      <TiltCard className="flex h-full flex-col rounded-2xl border border-ak-line/8 bg-ak-charcoal/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-colors group-hover:border-ak-blue/40 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_45px_-20px_rgba(36,81,255,0.35)]">
        {item.imageUrl ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-ak-line/5 bg-gradient-to-br from-ak-charcoal-2 to-ak-black p-2.5">
            <div className="relative h-full w-full overflow-hidden rounded-lg shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
              <Image
                src={item.imageUrl}
                alt={item.titre}
                fill
                sizes="(max-width: 640px) 90vw, 360px"
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          <AbstractMotif gold={isPromo} />
        )}

        <div className="mt-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isPromo ? "bg-ak-gold/15 text-ak-gold" : "bg-ak-blue/15 text-ak-blue-bright"
            }`}
          >
            {TYPE_LABEL[item.type]}
          </span>
          {item.departement && (
            <span className="font-accent text-xs italic text-ak-silver-dim">{item.departement}</span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-ak-white">{item.titre}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ak-silver">{item.chapo}</p>

        {item.infosPratiques && (
          <p className="mt-3 text-xs font-medium text-ak-silver-dim">{item.infosPratiques}</p>
        )}
        {item.datePublication && (
          <p className="mt-1 text-xs text-ak-silver-dim">{formatDate(item.datePublication)}</p>
        )}

        {item.ctaAction !== "info" || item.ctaLabel ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              open({
                itemId: item.id,
                itemTitre: item.titre,
                departement: item.departement,
                action: item.ctaAction,
                ctaLabel: item.ctaLabel || "En savoir plus",
                fichierUrl: item.fichierUrl,
              })
            }
            className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-ak-blue/40 px-4 py-2 text-sm font-semibold text-ak-white transition-colors hover:border-ak-blue hover:bg-ak-blue/10"
          >
            {item.ctaLabel || "En savoir plus"}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </motion.button>
        ) : null}
      </TiltCard>
    </motion.div>
  );
}
