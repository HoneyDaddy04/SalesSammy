import crypto from "crypto";
import { config } from "../config/env.js";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = config.vaultKey || config.anthropicApiKey;
  if (!raw) throw new Error("No vault key or API key configured for encryption");
  return crypto.createHash("sha256").update(raw).digest();
}

/** Encrypt a plaintext string. Returns "iv:tag:ciphertext" in base64. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/** Decrypt an encrypted blob. If data isn't encrypted (no colons), returns as-is. */
export function decrypt(blob: string): string {
  if (!blob || !blob.includes(":")) return blob;
  const parts = blob.split(":");
  if (parts.length !== 3) return blob;

  try {
    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // Not encrypted or corrupted — return as-is for migration safety
    return blob;
  }
}
