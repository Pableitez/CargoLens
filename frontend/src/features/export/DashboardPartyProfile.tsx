import { PartyProfileProvider } from "./partyProfile/PartyProfileContext";
import { PartyProfileView } from "./partyProfile/PartyProfileView";
import { usePartyProfile } from "./partyProfile/usePartyProfile";

export function DashboardPartyProfile() {
  const state = usePartyProfile();

  return (
    <PartyProfileProvider value={state}>
      <PartyProfileView />
    </PartyProfileProvider>
  );
}
