import { vi } from "vitest";

// Stop config from reading real env / disk during tests.
vi.mock("../src/config.js", () => ({
  getConfig: () => ({
    keyId: "TESTKEY123",
    issuerId: "00000000-0000-0000-0000-000000000000",
    privateKey: "test-key",
    baseUrl: "https://api.appstoreconnect.apple.com",
    timeoutMs: 30000,
  }),
  resetConfigForTesting: () => undefined,
}));

// JWT signing mocked — tests don't need real ES256 work.
vi.mock("../src/api/auth.js", () => ({
  getJwt: () => "test-jwt-token",
  resetJwtCacheForTesting: () => undefined,
}));

// API client mocked globally.
const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../src/api/client.js", () => ({
  getApiClient: () => apiMock,
  resetClientForTesting: () => undefined,
}));

export { apiMock };
