import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/admin/RegisterServiceWorker";
import { InstallPrompt } from "@/components/admin/InstallPrompt";

// Rend uniquement l'espace /admin installable comme application (PWA) —
// le site public garde ses propres métadonnées, définies dans le layout
// racine, inchangées.
export const metadata: Metadata = {
  title: "AkWorldService",
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AkWorldService",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterServiceWorker />
      <InstallPrompt />
      {children}
    </>
  );
}
