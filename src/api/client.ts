import axios, { AxiosInstance, AxiosError } from "axios";
import { getConfig } from "../config.js";
import { getJwt } from "./auth.js";

let client: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (client) return client;
  const cfg = getConfig();
  const instance = axios.create({
    baseURL: cfg.baseUrl,
    timeout: cfg.timeoutMs,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((req) => {
    req.headers.set("Authorization", `Bearer ${getJwt()}`);
    return req;
  });

  instance.interceptors.response.use(
    (resp) => resp,
    (error: AxiosError<unknown>) => {
      const status = error.response?.status;
      const data = error.response?.data as
        | { errors?: Array<{ title?: string; detail?: string; code?: string }> }
        | undefined;
      const apiErrors = data?.errors
        ?.map((e) => [e.code, e.title, e.detail].filter(Boolean).join(": "))
        .join(" | ");
      const message =
        apiErrors ||
        (typeof data === "string" ? data : undefined) ||
        error.message;
      const wrapped = new Error(
        status ? `App Store Connect API ${status}: ${message}` : `App Store Connect API: ${message}`
      );
      throw wrapped;
    }
  );

  client = instance;
  return client;
}

export function resetClientForTesting(): void {
  client = null;
}
