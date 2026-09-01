import type { CSSProperties } from "react";

const KEYWORDS = [
  "Conseil en gestion",
  "Formation professionnelle",
  "Comptabilité",
  "Entrepreneuriat",
  "TPE & PME",
  "Coopératives",
  "Insertion des jeunes",
];

/**
 * Bande défilante en continu (boucle invisible via duplication du contenu +
 * translation de 50%), en pause au survol. Vitesse constante en CSS pur —
 * respecte prefers-reduced-motion via la règle globale sur toutes les
 * animations.
 */
export function Marquee() {
  const items = [...KEYWORDS, ...KEYWORDS];

  return (
    <div className="marquee relative overflow-hidden border-y border-ak-line/8 bg-ak-charcoal/50 py-4">
      <div className="marquee-track flex w-max gap-10" style={{ "--marquee-duration": "26s" } as CSSProperties}>
        {items.map((word, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-ak-silver"
          >
            {word}
            <span aria-hidden className="text-ak-blue-bright">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
