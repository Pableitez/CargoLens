// Respuestas JSON `{ error, message }`; el front mapea `error` a i18n.
export function jsonError(res, status, code, message) {
  return res.status(status).json({ error: code, message });
}
