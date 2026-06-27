export type AuthUser = {
  id: string;
  email: string;
  companyId: string;
  companyName?: string;
  inviteCode?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientCode?: string | null;
  clientContractualTier?: string | null;
  parentClientId?: string | null;
  parentPartyId?: string | null;
  primaryClientId?: string | null;
  primaryClientName?: string | null;
  primaryClientCode?: string | null;
  clientInviteCode?: string | null;
  isClientPortal?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (body: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string }>;
  register: (body: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
};
