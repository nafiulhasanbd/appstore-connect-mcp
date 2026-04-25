# Security Policy

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Email: **nafiulhasanbd@gmail.com** with subject line `[SECURITY] appstore-connect-mcp`.

We aim to respond within 48 hours and patch high-severity issues within 7 days.

## Scope

In scope:
- Auth handling, JWT minting, key file reading
- Input validation in tool handlers
- Any path that could leak the `.p8` private key or JWT
- Dependency vulnerabilities affecting the server runtime

Out of scope:
- Issues in the official `@modelcontextprotocol/sdk` (report upstream)
- Issues in Apple's App Store Connect API (report to Apple)

## Hardening Checklist for Operators

- Keep your `.p8` file at `chmod 600` and outside version control.
- Use the smallest API key role that lets you do what you need.
- Rotate the key if a machine running this MCP is lost or compromised.
- Pin a specific `appstore-connect-mcp` version in production configs.
