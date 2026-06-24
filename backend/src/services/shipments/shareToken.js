import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 24;

export function generateShareToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashShareToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
