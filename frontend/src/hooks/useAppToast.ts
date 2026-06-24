import { useToast as useToastRaw } from "../contexts/ToastContext.jsx";

type ToastContextValue = {
  showToast: (options: { message: string; variant?: "success" | "error" | "info" }) => void;
};

export function useAppToast(): ToastContextValue {
  return useToastRaw() as ToastContextValue;
}
