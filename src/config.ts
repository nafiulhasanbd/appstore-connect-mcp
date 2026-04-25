import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";

const rawSchema = z
  .object({
    APP_STORE_CONNECT_KEY_ID: z
      .string()
      .min(1, "APP_STORE_CONNECT_KEY_ID is required"),
    APP_STORE_CONNECT_ISSUER_ID: z
      .string()
      .min(1, "APP_STORE_CONNECT_ISSUER_ID is required"),
    APP_STORE_CONNECT_PRIVATE_KEY_PATH: z.string().optional(),
    APP_STORE_CONNECT_PRIVATE_KEY: z.string().optional(),
    APP_STORE_CONNECT_BASE_URL: z
      .string()
      .url()
      .default("https://api.appstoreconnect.apple.com"),
    APP_STORE_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  })
  .refine(
    (v) =>
      Boolean(v.APP_STORE_CONNECT_PRIVATE_KEY_PATH) ||
      Boolean(v.APP_STORE_CONNECT_PRIVATE_KEY),
    {
      message:
        "Provide either APP_STORE_CONNECT_PRIVATE_KEY_PATH (path to .p8) or APP_STORE_CONNECT_PRIVATE_KEY (key contents)",
    }
  );

export interface AppStoreConnectConfig {
  keyId: string;
  issuerId: string;
  privateKey: string;
  baseUrl: string;
  timeoutMs: number;
}

function loadPrivateKey(path: string | undefined, raw: string | undefined): string {
  if (raw && raw.trim().length > 0) {
    // Allow escaped newlines from env vars (\n -> real newlines)
    return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  }
  if (!path) {
    throw new Error("Private key path missing");
  }
  if (!existsSync(path)) {
    throw new Error(`Private key file not found at: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function loadConfig(): AppStoreConnectConfig {
  const result = rawSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.errors.map((e) => `- ${e.message}`).join("\n");
    throw new Error(`Configuration error:\n${issues}`);
  }
  const env = result.data;
  const privateKey = loadPrivateKey(
    env.APP_STORE_CONNECT_PRIVATE_KEY_PATH,
    env.APP_STORE_CONNECT_PRIVATE_KEY
  );
  return {
    keyId: env.APP_STORE_CONNECT_KEY_ID,
    issuerId: env.APP_STORE_CONNECT_ISSUER_ID,
    privateKey,
    baseUrl: env.APP_STORE_CONNECT_BASE_URL,
    timeoutMs: env.APP_STORE_CONNECT_TIMEOUT_MS,
  };
}

let cached: AppStoreConnectConfig | null = null;

export function getConfig(): AppStoreConnectConfig {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

export function resetConfigForTesting(): void {
  cached = null;
}
