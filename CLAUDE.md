# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repo.

## Project

`appstore-connect-mcp` — an MCP server that exposes Apple App Store Connect API tools to LLMs.

## Architecture

- `src/index.ts` — entry point, just calls `startServer`.
- `src/server.ts` — `createServer()` builds an `McpServer` and registers every tool group.
- `src/config.ts` — loads + validates env vars with zod, reads the `.p8` file.
- `src/api/auth.ts` — mints ES256 JWTs (20-min TTL, cached in memory).
- `src/api/client.ts` — axios instance with a JWT-injecting request interceptor and an error-flattening response interceptor.
- `src/tools/*.ts` — one file per resource group. Each exports `register*Tools(server)`.
- `src/utils/` — `errors.ts` (`formatError`), `formatters.ts` (`jsonText`, `buildQueryParams`).

## Conventions

- ES modules, `NodeNext` resolution. Import sibling files with the `.js` extension even though sources are `.ts`.
- Every tool: zod schema with `.describe()` on every field, `try/catch`, `isError: true` on failures.
- Never log credentials. Never write to stdout (reserved for MCP). Use `console.error` for diagnostics only.
- New tool groups: add a file in `src/tools/`, register in `src/server.ts`, export from `src/tools/index.ts`, document in `README.md`.

## Common Tasks

- Add a tool → follow `src/tools/apps.ts` as the canonical pattern.
- Add an env var → extend `rawSchema` in `src/config.ts` plus README config table plus `.env.example`.
- Run tests → `npm test`. Tests mock `getApiClient` in `tests/setup.ts`.
- Build for publish → `npm run build` (tsup, ESM + types).

## Don't

- Don't accept arbitrary URLs from tool inputs. Stick to App Store Connect endpoints.
- Don't widen tool input types to `any` — zod schemas are the LLM's contract.
- Don't introduce a new HTTP client; reuse `getApiClient()` so the JWT refresh path stays single-source.
