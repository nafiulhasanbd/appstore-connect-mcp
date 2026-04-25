# Contributing

Thanks for considering a contribution.

## Development Setup

```bash
git clone https://github.com/pointerflow/appstore-connect-mcp
cd appstore-connect-mcp
npm install
cp .env.example .env
# Fill in your real Key ID, Issuer ID, and .p8 path
npm run dev
```

## Adding a New Tool

1. Create or open the relevant file in `src/tools/` (or add a new file and register it in `src/server.ts`).
2. Add the tool with `server.tool(name, description, zodSchema, handler)`.
3. Validate every input field with zod and add `.describe()` strings — the LLM uses them.
4. Wrap the handler in try/catch and return `{ isError: true }` on failure.
5. Add a test in `tests/tools/`.
6. Add an entry to the README tools table.

## Pull Request Process

1. Fork, branch off `main`.
2. Run `npm test` and `npm run lint` locally.
3. Update `CHANGELOG.md` under `## [Unreleased]`.
4. Open a PR with a clear description.

## Commit Message Format

Conventional Commits:

- `feat: add list_in_app_purchases tool`
- `fix: handle 429 rate limit retries`
- `docs: clarify Cursor setup`
- `chore: bump dependencies`
