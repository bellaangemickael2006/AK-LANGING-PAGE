"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LeadActionType } from "@/lib/types";
import { LeadModal } from "./LeadModal";

export interface LeadModalConfig {
  itemId: string;
  itemTitre: string;
  departement: string;
  action: LeadActionType;
  ctaLabel: string;
  fichierUrl?: string;
  onSuccess?: () => void;
}

interface LeadModalContextValue {
  open: (config: LeadModalConfig) => void;
}

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function useLeadModal() {
  const ctx = useContext(LeadModalContext);
  if (!ctx) throw new Error("useLeadModal doit être utilisé dans LeadModalProvider");
  return ctx;
}

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<LeadModalConfig | null>(null);

  const open = useCallback((c: LeadModalConfig) => setConfig(c), []);
  const close = useCallback(() => setConfig(null), []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <LeadModalContext.Provider value={value}>
      {children}
      <LeadModal config={config} onClose={close} />
    </LeadModalContext.Provider>
  );
}
