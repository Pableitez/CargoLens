import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useStableT } from "../../i18n/useStableT.js";
import * as clientsApi from "../../api/clients";

const DashboardWorkspaceContext = createContext(null);

export function DashboardWorkspaceProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { tRef } = useStableT();
  const isClientPortal = !!user?.isClientPortal;

  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [clientForm, setClientForm] = useState({ name: "", contractualTier: "primary", parentClientId: "" });
  const [savingClient, setSavingClient] = useState(false);

  const loadClients = useCallback(async () => {
    if (isClientPortal) return;
    try {
      const list = await clientsApi.fetchClients();
      setClients(list);
    } catch {
      setClients([]);
    }
  }, [isClientPortal]);

  useEffect(() => {
    loadClients().catch(() => {});
  }, [loadClients]);

  const handleAddClient = useCallback(
    async (e) => {
      e.preventDefault();
      if (!clientForm.name.trim()) return;
      setSavingClient(true);
      setError("");
      try {
        await clientsApi.createClient({
          name: clientForm.name.trim(),
          contractualTier: clientForm.contractualTier,
          parentClientId:
            clientForm.contractualTier === "subsidiary" ? clientForm.parentClientId || undefined : undefined,
        });
        setClientForm({ name: "", contractualTier: "primary", parentClientId: "" });
        await loadClients();
        showToast({ message: tRef.current("dashboard.clientCreated"), variant: "success" });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.clientCreateFailed"));
      } finally {
        setSavingClient(false);
      }
    },
    [clientForm, loadClients, showToast, tRef]
  );

  const handleDeleteClient = useCallback(
    async (id) => {
      if (!window.confirm(tRef.current("dashboard.confirmDeleteClient"))) return;
      try {
        await clientsApi.removeClient(id);
        await loadClients();
        showToast({ message: tRef.current("dashboard.clientDeleted"), variant: "success" });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.clientDeleteFailed"));
      }
    },
    [loadClients, showToast, tRef]
  );

  const handleUpdateClient = useCallback(
    async (id, name) => {
      const trimmed = String(name ?? "").trim();
      if (!trimmed) return;
      setError("");
      try {
        await clientsApi.updateClient(id, { name: trimmed });
        await loadClients();
        showToast({ message: tRef.current("dashboard.clientUpdated"), variant: "success" });
      } catch (err) {
        const msg = messageFromApiErrorOrKey(err, tRef.current, "dashboard.clientUpdateFailed");
        setError(msg);
        throw err;
      }
    },
    [loadClients, showToast, tRef]
  );

  const value = useMemo(
    () => ({
      user,
      isClientPortal,
      clients,
      error,
      setError,
      clientForm,
      setClientForm,
      savingClient,
      loadClients,
      handleAddClient,
      handleDeleteClient,
      handleUpdateClient,
    }),
    [
      user,
      isClientPortal,
      clients,
      error,
      clientForm,
      savingClient,
      loadClients,
      handleAddClient,
      handleDeleteClient,
      handleUpdateClient,
    ]
  );

  return <DashboardWorkspaceContext.Provider value={value}>{children}</DashboardWorkspaceContext.Provider>;
}

export function useDashboardWorkspace() {
  const ctx = useContext(DashboardWorkspaceContext);
  if (!ctx) throw new Error("useDashboardWorkspace must be used within DashboardWorkspaceProvider");
  return ctx;
}
