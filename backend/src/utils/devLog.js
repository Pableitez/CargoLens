// Errores internos solo en desarrollo; en producción la API responde igual sin ruido en stderr.
export function devError(...args) {
  if (process.env.NODE_ENV === "production") return;
  console.error(...args);
}
