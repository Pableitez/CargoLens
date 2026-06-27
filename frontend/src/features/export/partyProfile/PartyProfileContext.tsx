import { createContext, useContext, type ReactNode } from "react";
import type { PartyProfileState } from "./usePartyProfile";

const PartyProfileContext = createContext<PartyProfileState | null>(null);

export function PartyProfileProvider({ value, children }: { value: PartyProfileState; children: ReactNode }) {
  return <PartyProfileContext.Provider value={value}>{children}</PartyProfileContext.Provider>;
}

export function usePartyProfileContext() {
  const ctx = useContext(PartyProfileContext);
  if (!ctx) {
    throw new Error("usePartyProfileContext must be used within PartyProfileProvider");
  }
  return ctx;
}
