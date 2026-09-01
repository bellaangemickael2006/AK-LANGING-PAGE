"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative overflow-hidden border-b border-ak-gold/30 bg-ak-gold/10"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2 text-xs text-ak-gold sm:px-8">
            <span>
              Contenu de démonstration — connectez les Google Sheets (voir README) pour publier le
              vrai contenu du cabinet.
            </span>
            <button
              onClick={() => setVisible(false)}
              aria-label="Masquer ce message"
              className="shrink-0 rounded-full px-2 py-1 hover:bg-ak-gold/15"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
