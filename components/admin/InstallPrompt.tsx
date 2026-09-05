"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ak-admin-install-dismissed";

/**
 * Bannière d'installation personnalisée pour l'espace admin (PWA) : plutôt
 * que de compter sur les collègues pour trouver l'icône d'installation
 * cachée dans le menu du navigateur, on capte l'événement natif
 * "beforeinstallprompt" et on propose nous-mêmes un bouton "Installer".
 * Safari iOS n'expose aucun événement de ce type (Apple ne le permet pas) :
 * on y affiche à la place un rappel des 2 gestes manuels à faire.
 * N'affecte que /admin — n'est monté que dans app/admin/layout.tsx.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standaloneNav = window.navigator as Navigator & { standalone?: boolean };
    const alreadyInstalled =
      window.matchMedia("(display-mode: standalone)").matches || standaloneNav.standalone === true;
    if (alreadyInstalled) return;

    let alreadyDismissed = false;
    try {
      alreadyDismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Stockage indisponible (navigation privée) — on affiche quand même la bannière.
    }
    if (alreadyDismissed) return;

    const iOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(iOS);
    if (iOS) setVisible(true);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    function handleAppInstalled() {
      setVisible(false);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Pas grave si indisponible — la bannière peut réapparaître à la prochaine visite.
    }
  }

  async function handleInstallClick() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Installer l'application"
          className="fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex w-full max-w-md items-start gap-3.5 rounded-2xl border border-ak-line/10 bg-ak-charcoal p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] sm:items-center">
            <Image
              src="/icons/icon-192.png"
              alt="AkWorldService"
              width={44}
              height={44}
              className="h-11 w-11 flex-none rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ak-white">Installer AkWorldService</p>
              {isIOS ? (
                <p className="mt-0.5 text-xs leading-relaxed text-ak-silver">
                  Appuyez sur <strong className="text-ak-white">Partager</strong> puis{" "}
                  <strong className="text-ak-white">« Sur l&rsquo;écran d&rsquo;accueil »</strong>.
                </p>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed text-ak-silver">
                  Accès direct depuis le bureau ou l&rsquo;écran d&rsquo;accueil, sans navigateur.
                </p>
              )}
            </div>
            <div className="flex flex-none flex-col items-end gap-2 sm:flex-row sm:items-center">
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="rounded-full bg-ak-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ak-blue-bright"
                >
                  Installer
                </button>
              )}
              <button
                onClick={dismiss}
                aria-label="Plus tard"
                className="rounded-full p-2 text-ak-silver-dim transition-colors hover:bg-ak-line/5 hover:text-ak-white"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
