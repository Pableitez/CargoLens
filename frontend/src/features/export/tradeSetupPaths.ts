export function tradeSetupPartiesPath(isClientPortal: boolean) {
  return isClientPortal ? "/dashboard/trade-setup" : "/dashboard/clients/parties";
}

export function tradeSetupFacilitiesPath(isClientPortal: boolean) {
  return isClientPortal ? "/dashboard/trade-setup/facilities" : "/dashboard/clients/facilities";
}

export function partyProfilePath(isClientPortal: boolean, partyId: string) {
  return isClientPortal
    ? `/dashboard/trade-setup/parties/${partyId}`
    : `/dashboard/clients/parties/${partyId}`;
}
