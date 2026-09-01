import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Le personnel du cabinet colle des liens d'images depuis Google Drive,
    // Imgur ou ailleurs directement dans Google Sheets (colonne image_url) :
    // on ne peut pas prédire l'hébergeur à l'avance.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
