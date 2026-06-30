import { useAuth } from "../contexts/AuthContext";

/** True when the signed-in user belongs to a contractual client portal account. */
export function useIsClientPortal() {
  return !!useAuth().user?.isClientPortal;
}
