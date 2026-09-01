import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AK World Business Services — Conseil, formation & accompagnement",
  description:
    "Cabinet de conseil en gestion à Abidjan : accompagnement des TPE/PME, formations professionnelles et entrepreneuriat des jeunes. Actualités, formations et ressources du cabinet.",
};

// Posé avant l'hydratation pour éviter un flash du mauvais thème au
// chargement : lit la préférence enregistrée, sombre par défaut (identité
// de marque) si rien n'a encore été choisi.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("ak-theme");
    document.documentElement.dataset.theme = t === "light" ? "light" : "dark";
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${manrope.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
