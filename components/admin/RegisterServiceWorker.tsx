"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {
        // Installation impossible (navigateur non compatible, HTTP non sécurisé
        // en local) — le tableau de bord reste utilisable normalement.
      });
    }
  }, []);

  return null;
}
