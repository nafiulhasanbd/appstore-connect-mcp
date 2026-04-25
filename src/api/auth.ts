import jwt from "jsonwebtoken";
import { getConfig } from "../config.js";

const TOKEN_TTL_SECONDS = 1200; // 20 min — Apple max is 20 min
const REFRESH_BEFORE_EXPIRY_SECONDS = 60;

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

export function getJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - REFRESH_BEFORE_EXPIRY_SECONDS > now) {
    return cached.token;
  }
  const cfg = getConfig();
  const expiresAt = now + TOKEN_TTL_SECONDS;
  const token = jwt.sign(
    {
      iss: cfg.issuerId,
      iat: now,
      exp: expiresAt,
      aud: "appstoreconnect-v1",
    },
    cfg.privateKey,
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: cfg.keyId,
        typ: "JWT",
      },
    }
  );
  cached = { token, expiresAt };
  return token;
}

export function resetJwtCacheForTesting(): void {
  cached = null;
}
