import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

// Offline: eventos del navegador + peticiones axios sin respuesta del servidor.
const ApiConnectivityContext = createContext(null);

export function ApiConnectivityProvider({ children }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
    };
    const onOffline = () => {
      setOffline(true);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => {
        setOffline(false);
        return res;
      },
      (err) => {
        if (err?.response) {
          return Promise.reject(err);
        }
        if (err?.request) {
          setOffline(true);
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.response.eject(id);
    };
  }, []);

  const value = useMemo(() => ({ offline }), [offline]);

  return <ApiConnectivityContext.Provider value={value}>{children}</ApiConnectivityContext.Provider>;
}

export function useApiConnectivity() {
  const ctx = useContext(ApiConnectivityContext);
  if (!ctx) throw new Error("useApiConnectivity must be used within ApiConnectivityProvider");
  return ctx;
}
