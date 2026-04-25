# Building a Public MCP Server in TypeScript/Node.js
### A Complete Plan for Pointerflow LLC

> **Goal:** Build, publish, and maintain a production-grade MCP server as an open-source GitHub repository that other developers can install and use with Claude, Cursor, VS Code, and any MCP-compatible client.

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Phase 1 — Project Setup](#4-phase-1--project-setup)
5. [Phase 2 — Core Architecture](#5-phase-2--core-architecture)
6. [Phase 3 — Building Tools](#6-phase-3--building-tools)
7. [Phase 4 — Auth & Security](#7-phase-4--auth--security)
8. [Phase 5 — Testing](#8-phase-5--testing)
9. [Phase 6 — GitHub Repository Setup](#9-phase-6--github-repository-setup)
10. [Phase 7 — Distribution & Discovery](#10-phase-7--distribution--discovery)
11. [Phase 8 — Maintenance & Growth](#11-phase-8--maintenance--growth)
12. [MCP Ideas for Pointerflow](#12-mcp-ideas-for-pointerflow)
13. [Monetization Paths](#13-monetization-paths)

---

## 1. What We're Building

An MCP (Model Context Protocol) server is a lightweight process that exposes structured "tools" that Claude (or any MCP client) can call on your behalf. Think of it as a bridge between Claude and any external API or service.

**Examples of what an MCP tool looks like from the user's perspective:**

```
User → Claude: "Get all my Appwrite users who signed up this week"
Claude → MCP Server → Appwrite API → Returns data
Claude → User: "Here are 14 users who signed up this week..."
```

**What makes a great public MCP:**
- Wraps a popular API that developers already use
- Has clean, well-documented tools with clear descriptions
- Easy 1-command install
- Secure credential handling (never hardcoded)
- Active maintenance and a responsive README

---

## 2. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Language | TypeScript | Type safety, great DX, standard for MCP servers |
| Runtime | Node.js 18+ | LTS, universal availability |
| MCP SDK | `@modelcontextprotocol/sdk` | Official SDK from Anthropic |
| Validation | `zod` | Schema validation for tool inputs |
| HTTP Client | `axios` or native `fetch` | API calls to the target service |
| Build | `tsup` | Fast TypeScript bundler |
| Linter | `eslint` + `prettier` | Code quality |
| Testing | `vitest` | Fast unit tests |
| Publishing | `npm` | Distribution via `npx` |

---

## 3. Repository Structure

```
your-mcp-server/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # Run tests on every PR
│   │   └── publish.yml             # Auto-publish to npm on release
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── index.ts                    # Entry point — starts the MCP server
│   ├── server.ts                   # McpServer setup and tool registration
│   ├── config.ts                   # Environment variable loading & validation
│   ├── tools/
│   │   ├── index.ts                # Barrel export of all tools
│   │   ├── users.ts                # Example: user-related tools
│   │   ├── products.ts             # Example: product-related tools
│   │   └── orders.ts               # Example: order-related tools
│   ├── api/
│   │   ├── client.ts               # Configured API client (axios instance etc.)
│   │   └── types.ts                # TypeScript types for API responses
│   └── utils/
│       ├── errors.ts               # Error formatting helpers
│       └── formatters.ts           # Response formatting helpers
├── tests/
│   ├── tools/
│   │   ├── users.test.ts
│   │   └── orders.test.ts
│   └── setup.ts
├── examples/
│   ├── claude-desktop-config.json  # Ready-to-paste Claude Desktop config
│   └── usage-examples.md           # Example prompts and expected outputs
├── .env.example                    # Template for required env variables
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── CHANGELOG.md
├── CLAUDE.md                       # Instructions for Claude Code to work on this repo
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                         # MIT License
├── package.json
├── README.md                       # The most important file
├── SECURITY.md
└── tsconfig.json
```

---

## 4. Phase 1 — Project Setup

### Step 1: Initialize the project

```bash
mkdir your-mcp-server && cd your-mcp-server
git init
npm init -y
```

### Step 2: Install dependencies

```bash
# Core MCP
npm install @modelcontextprotocol/sdk

# Utilities
npm install zod axios dotenv

# Dev dependencies
npm install -D typescript tsup vitest eslint prettier \
  @types/node ts-node \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 3: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 4: package.json scripts

```json
{
  "name": "your-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for [Your Service] — manage X, Y, Z directly from Claude",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "your-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts",
    "dev": "ts-node src/index.ts",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["mcp", "claude", "model-context-protocol", "your-service"],
  "license": "MIT"
}
```

---

## 5. Phase 2 — Core Architecture

### src/config.ts — Environment & credential loading

```typescript
import { z } from "zod";

const configSchema = z.object({
  API_KEY: z.string().min(1, "API_KEY is required"),
  API_BASE_URL: z.string().url().default("https://api.yourservice.com"),
  TIMEOUT_MS: z.coerce.number().default(30000),
});

function loadConfig() {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.errors.map(e => e.message).join(", ");
    throw new Error(`Configuration error: ${missing}`);
  }
  return result.data;
}

export const config = loadConfig();
```

### src/api/client.ts — Configured API client

```typescript
import axios from "axios";
import { config } from "../config.js";

export const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUT_MS,
  headers: {
    "Authorization": `Bearer ${config.API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Global error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    throw new Error(`API Error: ${message}`);
  }
);
```

### src/server.ts — Server setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerUserTools } from "./tools/users.js";
import { registerOrderTools } from "./tools/orders.js";

export async function createServer() {
  const server = new McpServer({
    name: "your-mcp-server",
    version: "1.0.0",
  });

  // Register all tool groups
  registerUserTools(server);
  registerOrderTools(server);

  return server;
}

export async function startServer() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}
```

### src/index.ts — Entry point

```typescript
#!/usr/bin/env node
import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

---

## 6. Phase 3 — Building Tools

This is the main work. Each "tool" is a function Claude can call.

### Anatomy of a tool

```typescript
server.tool(
  "tool_name",              // snake_case, unique identifier
  "Clear description of what this tool does and when Claude should use it",
  {                         // Input schema using zod
    param1: z.string().describe("What this parameter is for"),
    param2: z.number().optional().describe("Optional parameter"),
  },
  async ({ param1, param2 }) => {
    // Your logic here
    const result = await apiClient.get(`/endpoint/${param1}`);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  }
);
```

### src/tools/users.ts — Example tool group

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";

export function registerUserTools(server: McpServer) {
  
  server.tool(
    "list_users",
    "List all users. Supports filtering by status, date range, and pagination.",
    {
      limit: z.number().min(1).max(100).default(20).describe("Number of users to return"),
      offset: z.number().default(0).describe("Pagination offset"),
      status: z.enum(["active", "inactive", "all"]).default("all").describe("Filter by status"),
    },
    async ({ limit, offset, status }) => {
      try {
        const response = await apiClient.get("/users", {
          params: { limit, offset, status: status !== "all" ? status : undefined },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_user",
    "Get a single user by their ID.",
    {
      user_id: z.string().describe("The unique user ID"),
    },
    async ({ user_id }) => {
      try {
        const response = await apiClient.get(`/users/${user_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_user",
    "Create a new user account.",
    {
      email: z.string().email().describe("User email address"),
      name: z.string().describe("Full name of the user"),
      role: z.enum(["admin", "member", "viewer"]).default("member").describe("User role"),
    },
    async ({ email, name, role }) => {
      try {
        const response = await apiClient.post("/users", { email, name, role });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
```

### src/utils/errors.ts — Error formatting

```typescript
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Unknown error: ${String(error)}`;
}
```

### Tool naming conventions

| Pattern | Example |
|---------|---------|
| List resources | `list_users`, `list_orders` |
| Get single resource | `get_user`, `get_order` |
| Create resource | `create_user`, `create_product` |
| Update resource | `update_user`, `update_product` |
| Delete resource | `delete_user`, `delete_product` |
| Actions/verbs | `send_email`, `publish_product`, `cancel_order` |
| Search/filter | `search_products`, `filter_orders` |

---

## 7. Phase 4 — Auth & Security

### Environment variables only — never hardcode credentials

```bash
# .env.example (commit this — it's a template with no real values)
YOUR_SERVICE_API_KEY=your_api_key_here
YOUR_SERVICE_BASE_URL=https://api.yourservice.com
```

```bash
# .env (add to .gitignore — never commit this)
YOUR_SERVICE_API_KEY=sk-real-key-here
```

### .gitignore must include

```
node_modules/
dist/
.env
*.env.local
.DS_Store
```

### SECURITY.md — responsible disclosure

```markdown
# Security Policy

## Reporting a Vulnerability

Please do NOT open a public GitHub issue for security vulnerabilities.

Email: security@pointerflow.com

We aim to respond within 48 hours and patch within 7 days.
```

### What to NEVER do

- ❌ Never log API keys or tokens to stdout/stderr
- ❌ Never store credentials in the codebase
- ❌ Never expose raw error stack traces to Claude's output
- ❌ Never allow arbitrary shell command execution via tools
- ✅ Always validate all inputs with zod before processing
- ✅ Always use `isError: true` on error responses so Claude knows it failed

---

## 8. Phase 5 — Testing

### tests/setup.ts

```typescript
import { vi } from "vitest";

// Mock the API client globally
vi.mock("../src/api/client.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### tests/tools/users.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiClient } from "../../src/api/client.js";
import { registerUserTools } from "../../src/tools/users.js";

describe("User Tools", () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: "test", version: "0.0.1" });
    registerUserTools(server);
    vi.clearAllMocks();
  });

  it("list_users returns formatted user data", async () => {
    const mockUsers = { users: [{ id: "1", name: "Test User" }] };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUsers });

    // Test tool invocation
    const result = await server.callTool("list_users", { limit: 10 });
    expect(result.content[0].text).toContain("Test User");
  });

  it("list_users handles API errors gracefully", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("API is down"));

    const result = await server.callTool("list_users", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API is down");
  });
});
```

---

## 9. Phase 6 — GitHub Repository Setup

### README.md structure (the most important file)

Your README is your product page. Structure it like this:

```markdown
# Your Service MCP Server

> Manage [your service] directly from Claude, Cursor, VS Code, or any MCP client.

[![npm version](https://badge.fury.io/js/your-mcp-server.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](...)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](...)

## Works With

[Claude Desktop] [Claude Code] [Cursor] [VS Code] [Windsurf]

## Quick Start

### 1. Get your API key
Go to [your service dashboard] → Settings → API Keys → Create Key

### 2. Add to Claude Desktop
Open `~/Library/Application Support/Claude/claude_desktop_config.json`:

\`\`\`json
{
  "mcpServers": {
    "your-service": {
      "command": "npx",
      "args": ["-y", "your-mcp-server"],
      "env": {
        "YOUR_SERVICE_API_KEY": "your_api_key_here"
      }
    }
  }
}
\`\`\`

### 3. Restart Claude Desktop and start using it!

**Example prompts:**
- "List all my active users"
- "Create a new user with email john@example.com"
- "Show me orders from last week"

## Available Tools

| Tool | Description |
|------|-------------|
| `list_users` | List and filter users |
| `get_user` | Get a single user by ID |
| `create_user` | Create a new user |
| `list_orders` | List orders with filters |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUR_SERVICE_API_KEY` | ✅ | Your API key from the dashboard |
| `YOUR_SERVICE_BASE_URL` | ❌ | Override API base URL (optional) |

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT — see [LICENSE](./LICENSE)
```

### GitHub Actions — .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run lint
```

### GitHub Actions — .github/workflows/publish.yml

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.x"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitHub Repository Settings checklist

- [ ] Add a clear description (match your README headline)
- [ ] Add relevant topics/tags: `mcp`, `claude`, `model-context-protocol`, `your-service-name`
- [ ] Add a license (MIT recommended for public MCPs)
- [ ] Enable GitHub Discussions for community questions
- [ ] Set up branch protection on `main` (require PR + CI pass)
- [ ] Add a CODEOWNERS file if you have collaborators
- [ ] Pin the latest release to the repo homepage
- [ ] Add a social preview image (1280x640px)

### CONTRIBUTING.md

```markdown
# Contributing

We welcome contributions! Here's how to get started:

## Development Setup

\`\`\`bash
git clone https://github.com/your-username/your-mcp-server
cd your-mcp-server
npm install
cp .env.example .env
# Fill in your .env with real credentials
npm run dev
\`\`\`

## Adding a New Tool

1. Create or open the relevant file in `src/tools/`
2. Add your tool using `server.tool(...)`
3. Export and register it in `src/server.ts`
4. Add tests in `tests/tools/`
5. Document it in README.md's tools table

## Pull Request Process

1. Fork the repo and create a feature branch
2. Write tests for your changes
3. Ensure `npm test` and `npm run lint` pass
4. Submit a PR with a clear description

## Commit Message Format

Use conventional commits:
- `feat: add list_subscriptions tool`
- `fix: handle 429 rate limit errors`
- `docs: update Claude Desktop config example`
- `chore: bump dependencies`
```

---

## 10. Phase 7 — Distribution & Discovery

### Publishing to npm

```bash
# Login to npm
npm login

# Publish (first time)
npm publish --access public

# Subsequent releases — bump version first
npm version patch    # 1.0.0 → 1.0.1 (bug fixes)
npm version minor    # 1.0.0 → 1.1.0 (new tools)
npm version major    # 1.0.0 → 2.0.0 (breaking changes)
npm publish
```

### Getting discovered — submit to MCP directories

After publishing, submit your server to these directories:

| Directory | URL |
|-----------|-----|
| MCP.so | https://mcp.so/submit |
| Glama MCP Registry | https://glama.ai/mcp/servers |
| Smithery | https://smithery.ai |
| awesome-mcp-servers (GitHub) | Submit a PR to the repo |
| Pulsemcp | https://pulsemcp.com |

### npx install experience

Make sure users can install and run with zero friction:

```bash
# This should just work after publishing to npm
npx your-mcp-server
```

Test this yourself before announcing. It's the first thing users will try.

---

## 11. Phase 8 — Maintenance & Growth

### CHANGELOG.md format

```markdown
# Changelog

## [1.1.0] - 2025-06-01
### Added
- `search_users` tool with full-text search support
- `export_orders` tool for CSV export

### Fixed
- Rate limit handling now retries automatically

## [1.0.0] - 2025-05-01
### Added
- Initial release with 12 tools
- User management: list, get, create, update, delete
- Order management: list, get, create, cancel
```

### Versioning strategy

Follow semantic versioning strictly:
- **Patch** (1.0.x): Bug fixes, no API changes
- **Minor** (1.x.0): New tools added, backwards compatible
- **Major** (x.0.0): Tool names changed, parameters changed, breaking

### Handling issues

Set expectations in your README:
```markdown
## Support
- 🐛 Bugs: Open a GitHub issue
- 💡 Feature requests: Start a GitHub Discussion
- 🔒 Security: Email security@pointerflow.com
- Response time: Best effort, typically within 1 week
```

---

## 12. MCP Ideas for Pointerflow

These are the most valuable MCPs you could build, ranked by impact:

### 🥇 Appwrite MCP (`appwrite-mcp`)
**Target audience:** All Appwrite developers worldwide (large, fast-growing community)

Tools to build:
- `list_databases`, `get_database`, `create_database`
- `list_collections`, `create_collection`
- `query_documents`, `create_document`, `update_document`, `delete_document`
- `list_users`, `get_user`, `create_user`, `update_user_labels`
- `list_functions`, `execute_function`
- `get_storage_files`, `upload_file`
- `get_project_usage` (bandwidth, requests, storage)

**Why this wins:** Appwrite has 40k+ GitHub stars and no official MCP yet. First-mover advantage.

---

### 🥈 Shopify Store Manager MCP (`shopify-store-mcp`)
**Target audience:** Shopify merchants and developers — massive market

Tools to build:
- `list_products`, `get_product`, `create_product`, `update_product`
- `list_orders`, `get_order`, `update_order_status`, `cancel_order`
- `list_customers`, `get_customer`, `create_customer`
- `get_inventory_levels`, `adjust_inventory`
- `list_collections`, `add_product_to_collection`
- `get_shop_analytics` (sales, sessions, conversion)
- `create_discount_code`

**Why this wins:** Connects directly to your existing Shopify expertise and Upwork services.

---

### 🥉 RevenueCat MCP (`revenuecat-mcp`)
**Target audience:** iOS/Android indie developers

Tools to build:
- `get_subscriber`, `get_subscription_status`
- `list_products`, `get_product_revenue`
- `get_charts_data` (MRR, ARR, churn, trials)
- `list_offerings`, `get_offering`
- `get_app_overview` (revenue, subscribers, trials)

**Why this wins:** Every Pointerflow app already uses RevenueCat. You know it deeply.

---

## 13. Monetization Paths

| Path | Description | Effort |
|------|-------------|--------|
| **Open Source + Consulting** | Free MCP builds your reputation → paid Upwork work | Low |
| **Hosted / Managed Version** | Offer a hosted version with OAuth (no API key setup needed) | High |
| **Premium Tools Tier** | Core tools free, advanced tools behind a subscription | Medium |
| **Sponsorships** | Once you have GitHub stars, add a sponsor button | Low |
| **Bundle with Services** | Include as a premium add-on for Shopify clients | Low |

**Recommended starting path for Pointerflow:**
Build the Appwrite MCP as open source → get GitHub stars and npm downloads → use it as a portfolio piece for developer tool consulting.

---

## Quick Start Checklist

```
Project Setup
  [ ] npm init + install dependencies
  [ ] Configure TypeScript and tsup
  [ ] Set up ESLint and Prettier
  [ ] Create .env.example

Core Build
  [ ] src/config.ts with zod validation
  [ ] src/api/client.ts with interceptors
  [ ] src/server.ts with McpServer
  [ ] src/index.ts entry point
  [ ] First tool group working locally

Tools
  [ ] 5-10 tools covering core use cases
  [ ] All inputs validated with zod
  [ ] Error handling on every tool
  [ ] Tested with Claude Desktop locally

GitHub
  [ ] Public repository created
  [ ] MIT License added
  [ ] README.md with Quick Start
  [ ] .env.example committed
  [ ] .env in .gitignore
  [ ] CI workflow running
  [ ] CHANGELOG.md started

Publishing
  [ ] Built and tested with npx
  [ ] Published to npm
  [ ] Submitted to MCP directories
  [ ] Topics/tags added to GitHub repo
```

---

*Built by Pointerflow LLC — https://github.com/pointerflow*
