// Traduce errores JSON del backend (error/code + message) a texto para el usuario (apiErrors.* o genérico).
export function messageFromApiError(err, t) {
  const data = err?.response?.data;
  const code = data?.error ?? data?.code;
  const raw = data?.message;
  if (code) {
    const key = `apiErrors.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  if (raw && typeof raw === "string") return raw;
  return t("apiErrors.generic");
}

// Si hay código de error, usa messageFromApiError; si no, message o fallbackKey.
export function messageFromApiErrorOrKey(err, t, fallbackKey) {
  const data = err?.response?.data;
  if (data?.error ?? data?.code) return messageFromApiError(err, t);
  return data?.message ?? t(fallbackKey);
}
