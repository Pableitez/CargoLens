import { useRef } from "react";
import { useTranslation } from "./LanguageContext.jsx";

// Ref a `t` actual para efectos/callbacks sin depender de `t` (evita refetch al cambiar idioma).
export function useStableT() {
  const { t, ...rest } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  return { t, tRef, ...rest };
}
