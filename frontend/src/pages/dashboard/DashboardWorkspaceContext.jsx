import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useStableT } from "../../i18n/useStableT.js";
import * as containersApi from "../../api/containers.js";
import * as clientsApi from "../../api/clients.js";
import { setPaletteContainerNumbers } from "../../utils/recentPalette.js";

const DashboardWorkspaceContext = createContext(null);

export function DashboardWorkspaceProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { tRef } = useStableT();
  const location = useLocation();
  const isClientPortal = !!user?.isClientPortal;

  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientFilter, setClientFilter] = useState("");
  const [clientIdFilter, setClientIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ containerNumber: "", clientId: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "" });
  const [savingClient, setSavingClient] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const params = {};
      if (!isClientPortal && clientIdFilter) params.clientId = clientIdFilter;
      const list = await containersApi.fetchContainers(params);
      setItems(list);
    } catch (e) {
      setError(messageFromApiErrorOrKey(e, tRef.current, "dashboard.loadContainersFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isClientPortal, clientIdFilter, tRef]);

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
    void load();
  }, [load]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!user) return;
    setPaletteContainerNumbers(items.map((i) => i.containerNumber).filter(Boolean));
  }, [items, user]);

  // Deep-link desde resumen: /dashboard/list?clientId=…
  useEffect(() => {
    if (!location.pathname.endsWith("/list")) return;
    const cid = new URLSearchParams(location.search).get("clientId");
    if (cid) setClientIdFilter(cid);
  }, [location.pathname, location.search]);


  const filteredItems = useMemo(() => {
    const q = clientFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => (row.clientName || "").toLowerCase().includes(q));
  }, [items, clientFilter]);

  const overviewStats = useMemo(() => {
    const total = items.length;
    const assigned = items.filter((r) => r.clientId).length;
    const unassigned = total - assigned;
    return { total, assigned, unassigned };
  }, [items]);

  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.containerNumber.trim()) return;
      setSaving(true);
      setError("");
      try {
        const body = {
          containerNumber: form.containerNumber.trim(),
          notes: form.notes.trim(),
        };
        if (form.clientId) body.clientId = form.clientId;
        await containersApi.saveContainer(body);
        setForm({ containerNumber: "", clientId: "", notes: "" });
        await load();
        showToast({ message: tRef.current("dashboard.containerSaved"), variant: "success" });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.saveFailed"));
      } finally {
        setSaving(false);
      }
    },
    [form, load, showToast, tRef]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm(tRef.current("dashboard.confirmRemoveContainer"))) return;
      try {
        await containersApi.removeContainer(id);
        await load();
        showToast({ message: tRef.current("dashboard.containerRemoved"), variant: "success" });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.deleteFailed"));
      }
    },
    [load, showToast, tRef]
  );

  const handleAddClient = useCallback(
    async (e) => {
      e.preventDefault();
      if (!clientForm.name.trim()) return;
      setSavingClient(true);
      setError("");
      try {
        await clientsApi.createClient({ name: clientForm.name.trim() });
        setClientForm({ name: "" });
        await loadClients();
        showToast({ message: tRef.current("dashboard.clientCreated"), variant: "success" });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.clientCreateFailed"));
      } finally {
        setSavingClient(false);
      }
    },
    [clientForm.name, loadClients, showToast, tRef]
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
        await load();
        showToast({ message: tRef.current("dashboard.clientUpdated"), variant: "success" });
      } catch (err) {
        const msg = messageFromApiErrorOrKey(err, tRef.current, "dashboard.clientUpdateFailed");
        setError(msg);
        throw err;
      }
    },
    [load, loadClients, showToast, tRef]
  );

  const handleUpdateContainer = useCallback(
    async (id, patch) => {
      setError("");
      try {
        await containersApi.updateContainer(id, patch);
        await load();
        showToast({ message: tRef.current("dashboard.changesSaved"), variant: "success" });
      } catch (err) {
        const msg = messageFromApiErrorOrKey(err, tRef.current, "dashboard.containerUpdateFailed");
        setError(msg);
        throw err;
      }
    },
    [load, showToast, tRef]
  );

  const handleImportFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setImportMsg(null);
      setError("");
      setImporting(true);
      try {
        const res = await containersApi.importContainersExcel(file);
        const msg = tRef.current("dashboard.importSummary", { created: res.created, skipped: res.skipped });
        setImportMsg(res.errors?.length ? `${msg} ${res.errors.slice(0, 3).join(" · ")}` : msg);
        await load();
        showToast({
          message: tRef.current("dashboard.importDoneDetail", { created: res.created, skipped: res.skipped }),
          variant: "success",
        });
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, tRef.current, "dashboard.importFailed"));
      } finally {
        setImporting(false);
      }
    },
    [load, showToast, tRef]
  );

  const value = useMemo(
    () => ({
      user,
      isClientPortal,
      items,
      clients,
      clientFilter,
      setClientFilter,
      clientIdFilter,
      setClientIdFilter,
      loading,
      error,
      setError,
      form,
      setForm,
      saving,
      clientForm,
      setClientForm,
      savingClient,
      importMsg,
      importing,
      filteredItems,
      overviewStats,
      load,
      handleAdd,
      handleDelete,
      handleAddClient,
      handleDeleteClient,
      handleUpdateClient,
      handleUpdateContainer,
      handleImportFile,
    }),
    [
      user,
      isClientPortal,
      items,
      clients,
      clientFilter,
      clientIdFilter,
      loading,
      error,
      form,
      saving,
      clientForm,
      savingClient,
      importMsg,
      importing,
      filteredItems,
      overviewStats,
      load,
      handleAdd,
      handleDelete,
      handleAddClient,
      handleDeleteClient,
      handleUpdateClient,
      handleUpdateContainer,
      handleImportFile,
    ]
  );

  return <DashboardWorkspaceContext.Provider value={value}>{children}</DashboardWorkspaceContext.Provider>;
}

export function useDashboardWorkspace() {
  const ctx = useContext(DashboardWorkspaceContext);
  if (!ctx) throw new Error("useDashboardWorkspace must be used within DashboardWorkspaceProvider");
  return ctx;
}
