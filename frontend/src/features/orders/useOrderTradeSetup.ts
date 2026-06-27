import { useCallback, useEffect, useMemo, useState } from "react";
import * as clientsApi from "../../api/clients";
import * as ordersApi from "../../api/orders";
import * as partiesApi from "../../api/parties";
import type { ContractualClient } from "../../api/clients";
import type { OrderTradePartyOption } from "../../api/orders";
import type { EntitySearchOption } from "../../components/EntitySearchPicker";
import { filterEntityOptions, partyOptionLabel, toEntitySearchOption } from "./orderTradeUtils";

export type OrderTradeSelection = {
  contractualPartyId: string;
  supplyChainId: string;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
};

export type OrderChainDefaults = {
  incoterm: string;
  transportMode: string;
  portOfLoading: string;
  portOfDischarge: string;
};

export const EMPTY_ORDER_TRADE_SELECTION: OrderTradeSelection = {
  contractualPartyId: "",
  supplyChainId: "",
  operatingShipperPartyId: "",
  operatingConsigneePartyId: "",
};

type UseOrderTradeSetupOptions = {
  enabled?: boolean;
  selection: OrderTradeSelection;
  onChainDefaults?: (defaults: OrderChainDefaults) => void;
};

const MAX_OPTIONS = 50;

function mergeContractualClients(
  fromClients: ContractualClient[],
  fromParties: Awaited<ReturnType<typeof partiesApi.fetchParties>>
): ContractualClient[] {
  const byId = new Map<string, ContractualClient>();

  for (const client of fromClients) {
    byId.set(client.id, client);
  }

  for (const party of fromParties) {
    if ((party.accountTier ?? "operational") !== "contractual") continue;
    if (byId.has(party.id)) continue;
    byId.set(party.id, {
      id: party.id,
      name: party.legalName,
      code: party.code,
      contractualTier: party.contractualTier ?? "primary",
      parentClientId: party.parentPartyId ?? null,
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function contractualFromParties(
  parties: Awaited<ReturnType<typeof partiesApi.fetchParties>>
): EntitySearchOption[] {
  return parties
    .filter((party) => (party.accountTier ?? "operational") === "contractual")
    .map((party) => toEntitySearchOption(party.id, party.code, party.legalName));
}

export function useOrderTradeSetup({
  enabled = true,
  selection,
  onChainDefaults,
}: UseOrderTradeSetupOptions) {
  const [clients, setClients] = useState<ContractualClient[]>([]);
  const [shipperOptions, setShipperOptions] = useState<OrderTradePartyOption[]>([]);
  const [consigneeOptions, setConsigneeOptions] = useState<OrderTradePartyOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingPartyOptions, setLoadingPartyOptions] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setClients([]);
      return;
    }

    let cancelled = false;
    setLoadingClients(true);
    Promise.all([clientsApi.fetchClients().catch(() => []), partiesApi.fetchParties().catch(() => [])])
      .then(([clientRows, partyRows]) => {
        if (cancelled) return;
        setClients(mergeContractualClients(clientRows, partyRows));
      })
      .finally(() => {
        if (!cancelled) setLoadingClients(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const applyDefaults = useCallback(
    (defaults: OrderChainDefaults | null) => {
      if (!defaults) return;
      onChainDefaults?.(defaults);
    },
    [onChainDefaults]
  );

  useEffect(() => {
    const clientId = selection.contractualPartyId.trim();
    if (!enabled || !clientId) {
      setShipperOptions([]);
      setConsigneeOptions([]);
      return;
    }

    let cancelled = false;
    setLoadingPartyOptions(true);
    ordersApi
      .fetchOrderTradePartyOptions(clientId)
      .then((result) => {
        if (cancelled) return;
        setShipperOptions(result.shippers);
        setConsigneeOptions(result.consignees);
        applyDefaults(result.defaults);
      })
      .catch(() => {
        if (!cancelled) {
          setShipperOptions([]);
          setConsigneeOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPartyOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyDefaults, enabled, selection.contractualPartyId]);

  const customerOptions = useMemo(
    () => clients.map((client) => toEntitySearchOption(client.id, client.code, client.name)),
    [clients]
  );

  const shipperEntityOptions = useMemo(
    () =>
      shipperOptions.map((node) => toEntitySearchOption(node.partyId, node.partyCode, node.partyLegalName)),
    [shipperOptions]
  );

  const consigneeEntityOptions = useMemo(
    () =>
      consigneeOptions.map((node) => toEntitySearchOption(node.partyId, node.partyCode, node.partyLegalName)),
    [consigneeOptions]
  );

  const searchContractualCustomers = useCallback(
    async (query: string) => {
      const local = filterEntityOptions(customerOptions, query);
      if (local.length > 0) return local.slice(0, MAX_OPTIONS);

      try {
        const parties = query.trim()
          ? await partiesApi.fetchParties({ q: query.trim() })
          : await partiesApi.fetchParties();
        const remote = filterEntityOptions(contractualFromParties(parties), query);
        if (remote.length > 0) return remote.slice(0, MAX_OPTIONS);
      } catch {
        // fall through
      }

      return local.slice(0, MAX_OPTIONS);
    },
    [customerOptions]
  );

  const searchShippers = useCallback(
    async (query: string) => filterEntityOptions(shipperEntityOptions, query).slice(0, MAX_OPTIONS),
    [shipperEntityOptions]
  );

  const searchConsignees = useCallback(
    async (query: string) => filterEntityOptions(consigneeEntityOptions, query).slice(0, MAX_OPTIONS),
    [consigneeEntityOptions]
  );

  const selectedCustomerLabel = useMemo(() => {
    const client = clients.find((row) => row.id === selection.contractualPartyId);
    return client ? partyOptionLabel(client.code, client.name) : "";
  }, [clients, selection.contractualPartyId]);

  const selectedShipperLabel = useMemo(() => {
    const node = shipperOptions.find((row) => row.partyId === selection.operatingShipperPartyId);
    return node ? partyOptionLabel(node.partyCode, node.partyLegalName) : "";
  }, [selection.operatingShipperPartyId, shipperOptions]);

  const selectedConsigneeLabel = useMemo(() => {
    const node = consigneeOptions.find((row) => row.partyId === selection.operatingConsigneePartyId);
    return node ? partyOptionLabel(node.partyCode, node.partyLegalName) : "";
  }, [consigneeOptions, selection.operatingConsigneePartyId]);

  return {
    loadingClients,
    loadingPartyOptions,
    clients,
    shipperOptions,
    consigneeOptions,
    searchContractualCustomers,
    searchShippers,
    searchConsignees,
    selectedCustomerLabel,
    selectedShipperLabel,
    selectedConsigneeLabel,
  };
}
