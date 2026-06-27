import { useCallback, useEffect, useState } from "react";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import { useStableT } from "../i18n/useStableT.js";

export function useModuleListQuery<T>(fetchItems: () => Promise<T[]>, loadFailedKey: string) {
  const { tRef } = useStableT();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchItems();
      setItems(rows);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, tRef.current, loadFailedKey));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchItems, loadFailedKey, tRef]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return {
    items,
    setItems,
    loading,
    error,
    load,
    showEmptyDataset: !loading && items.length === 0,
    hasItems: items.length > 0,
  };
}

export type ModuleListQueryState<T> = ReturnType<typeof useModuleListQuery<T>>;
