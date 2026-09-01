import { getContenus } from "@/lib/sheets";
import { PLACEHOLDER_CONTENT } from "@/lib/placeholders";
import { SiteShell } from "@/components/SiteShell";

export const revalidate = 60;

export default async function Home() {
  const contenus = await getContenus();
  const demoMode = contenus === null;
  const items = contenus ?? PLACEHOLDER_CONTENT;

  const actualites = items.filter((i) => i.type === "actualite" || i.type === "promotion");
  const formations = items.filter((i) => i.type === "formation");
  const ebooks = items.filter((i) => i.type === "ebook" || i.type === "article");

  return (
    <SiteShell demoMode={demoMode} actualites={actualites} formations={formations} ebooks={ebooks} />
  );
}
