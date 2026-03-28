import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Estado abierto/cerrado de la paleta (⌘K).
const CommandPaletteContext = createContext(null);

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, setOpen, toggle, close }), [open, toggle, close]);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}
