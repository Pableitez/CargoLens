import { useEffect, useState } from "react";
import * as ordersApi from "../../api/orders";

export function useOrderTradeContext() {
  const [usesTradeMasters, setUsesTradeMasters] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ordersApi
      .fetchOrderTradeContext()
      .then((context) => {
        if (!cancelled) setUsesTradeMasters(context.usesTradeMasters);
      })
      .catch(() => {
        if (!cancelled) setUsesTradeMasters(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { usesTradeMasters, loading };
}
