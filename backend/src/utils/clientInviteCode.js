import crypto from "crypto";

// Código invitación portal cliente: prefijo C para no chocar con códigos de empresa (8 hex).
export function generateClientInviteCode() {
  return `C${crypto.randomBytes(4).toString("hex").slice(0, 7).toUpperCase()}`;
}
