import { ContentItem } from "@/lib/types";
import { ContentCard } from "./ContentCard";
import { Reveal } from "./Reveal";
import { SectionAmbient } from "./SectionAmbient";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="font-accent text-sm italic text-ak-blue-bright">{eyebrow}</span>
      <h2 className="mt-2 text-2xl font-extrabold text-ak-white sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ak-silver sm:text-base">{description}</p>
    </Reveal>
  );
}

function Grid({ items }: { items: ContentItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-ak-silver-dim">
        Aucun contenu publié pour le moment.
      </p>
    );
  }
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ContentCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

export function SectionActualites({ items }: { items: ContentItem[] }) {
  return (
    <section id="actualites" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <SectionAmbient />
      <div className="relative">
        <SectionHeading
          eyebrow="Le journal du cabinet"
          title="Actualités"
          description="Les dernières nouvelles d'AK World Business Services : accompagnements, publications et offres du moment."
        />
        <Grid items={items} />
      </div>
    </section>
  );
}

export function SectionFormations({ items }: { items: ContentItem[] }) {
  return (
    <section id="formations" className="relative overflow-hidden border-t border-ak-line/6 bg-ak-charcoal/40">
      <SectionAmbient />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeading
          eyebrow="Se former"
          title="Formations professionnelles"
          description="Des sessions courtes et pratiques pour les dirigeants de TPE/PME et les jeunes porteurs de projet."
        />
        <Grid items={items} />
      </div>
    </section>
  );
}

export function SectionEbooks({ items }: { items: ContentItem[] }) {
  return (
    <section id="ressources" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <SectionAmbient />
      <div className="relative">
        <SectionHeading
          eyebrow="Pour aller plus loin"
          title="Ressources à télécharger"
          description="Guides pratiques et ebooks du cabinet, à télécharger gratuitement."
        />
        <Grid items={items} />
      </div>
    </section>
  );
}
