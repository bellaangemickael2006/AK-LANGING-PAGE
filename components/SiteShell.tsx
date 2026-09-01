"use client";

import { ContentItem } from "@/lib/types";
import { LeadModalProvider } from "./LeadModalContext";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { DemoBanner } from "./DemoBanner";
import { SectionActualites, SectionFormations, SectionEbooks } from "./Sections";
import { Footer } from "./Footer";
import { Marquee } from "./Marquee";

export function SiteShell({
  demoMode,
  actualites,
  formations,
  ebooks,
}: {
  demoMode: boolean;
  actualites: ContentItem[];
  formations: ContentItem[];
  ebooks: ContentItem[];
}) {
  return (
    <LeadModalProvider>
      <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
        {demoMode && <DemoBanner />}
        <Header />
      </div>
      <main>
        <Hero />
        <Marquee />
        <SectionActualites items={actualites} />
        <SectionFormations items={formations} />
        <SectionEbooks items={ebooks} />
      </main>
      <Footer />
    </LeadModalProvider>
  );
}
