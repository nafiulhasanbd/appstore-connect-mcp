# App Store Connect MCP

> Manage your Apple App Store Connect account directly from Claude, Cursor, VS Code, Windsurf, or any MCP-compatible client.

[![npm version](https://img.shields.io/npm/v/appstore-connect-mcp.svg)](https://www.npmjs.com/package/appstore-connect-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Built by [Nafiul Hasan](https://github.com/pointerflow) at Pointerflow LLC.

## Works With

Claude Desktop · Claude Code · Cursor · VS Code (with MCP) · Windsurf · any MCP client

## What It Does

This MCP server gives an LLM safe, structured access to the [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi). Once configured, you can ask Claude things like:

- "Show me all my apps and their current store states."
- "List the latest TestFlight builds for app `com.acme.foo` and tell me which are still processing."
- "Pull the last 50 one-star reviews from the US for app X. Draft polite responses I can paste."
- "Download yesterday's daily sales report for vendor 12345."
- "Invite alice@example.com to my 'Power Users' beta group."

All calls are made server-side using your own API key — your credentials never touch the LLM.

## Quick Start

### 1. Generate an App Store Connect API key

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/access/integrations/api).
2. **Users and Access → Integrations → App Store Connect API**.
3. Click **Generate API Key** (or **+** if you already have one).
4. Give it a role appropriate to what you want Claude to do (Admin, App Manager, Developer, etc.).
5. Download the `.p8` file. **You can only download it once — store it securely.**
6. Note your **Key ID** (10 chars) and **Issuer ID** (UUID at the top of the page).

### 2. Add to Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "appstore-connect": {
      "command": "npx",
      "args": ["-y", "appstore-connect-mcp"],
      "env": {
        "APP_STORE_CONNECT_KEY_ID": "ABC1234DEF",
        "APP_STORE_CONNECT_ISSUER_ID": "00000000-0000-0000-0000-000000000000",
        "APP_STORE_CONNECT_PRIVATE_KEY_PATH": "/Users/you/keys/AuthKey_ABC1234DEF.p8"
      }
    }
  }
}
```

Restart Claude Desktop. The tools appear under the plug icon.

### 3. Add to Claude Code

```bash
claude mcp add appstore-connect \
  -e APP_STORE_CONNECT_KEY_ID=ABC1234DEF \
  -e APP_STORE_CONNECT_ISSUER_ID=00000000-0000-0000-0000-000000000000 \
  -e APP_STORE_CONNECT_PRIVATE_KEY_PATH=/Users/you/keys/AuthKey_ABC1234DEF.p8 \
  -- npx -y appstore-connect-mcp
```

### 4. Add to Cursor / VS Code / Windsurf

Same JSON shape as Claude Desktop — see [examples/](./examples/) for ready-to-paste configs.

## Available Tools

**90+ tools across 16 groups.** End-to-end App Store submission, Custom Product Pages, Product Page Optimization (A/B tests), and In-App Events all supported. Only binary upload (use Transporter / `xcrun altool`) and initial app creation (web UI / Developer Portal) fall outside the API.

### Apps

| Tool | Description |
|------|-------------|
| `list_apps` | List all apps. Filter by bundle ID, name, SKU. |
| `get_app` | Get one app with optional related resources. |
| `list_app_store_versions` | List versions for an app, filterable by store state. |
| `get_app_store_version` | Get a single App Store version. |

### App Metadata & Categories

| Tool | Description |
|------|-------------|
| `list_app_infos` | List appInfo records (per-state metadata). |
| `update_app_info` | Set primary/secondary categories and subcategories. |
| `list_app_categories` | List Apple's category catalog. |
| `list_app_info_localizations` | List localized name/subtitle/privacy URLs. |
| `create_app_info_localization` | Add a locale (name, subtitle, privacy URL). |
| `update_app_info_localization` | Edit name/subtitle/privacy URLs in one locale. |

### Version Localizations (Description, Keywords, What's New)

| Tool | Description |
|------|-------------|
| `list_app_store_version_localizations` | List per-locale version metadata. |
| `get_app_store_version_localization` | Get one locale's metadata. |
| `create_app_store_version_localization` | Add a locale with description, keywords, promo text, what's new, marketing/support URLs. |
| `update_app_store_version_localization` | Edit any of the above. |
| `delete_app_store_version_localization` | Remove a locale from a version. |

### Screenshots & App Previews

| Tool | Description |
|------|-------------|
| `list_screenshot_sets` | List screenshot sets per device size. |
| `create_screenshot_set` | Create a set for a device size (e.g. APP_IPHONE_67). |
| `upload_screenshot` | Reserve + upload + commit a screenshot file. |
| `list_screenshots` | List uploaded screenshots in a set. |
| `reorder_screenshots` | Set display order. |
| `delete_screenshot` | Delete one screenshot. |
| `list_preview_sets` / `create_preview_set` | App preview video sets. |
| `upload_app_preview` | Reserve + upload + commit a preview video. |

### Pricing & Availability

| Tool | Description |
|------|-------------|
| `get_app_price_schedule` | Get current price schedule. |
| `set_app_price_schedule` | Set base territory + scheduled price periods. |
| `list_app_price_points` | List Apple price tiers. |
| `get_app_availability` | Get territories where app is offered. |
| `set_app_availability` | Replace territory list. |
| `list_territories` | List Apple territories. |

### In-App Purchases

| Tool | Description |
|------|-------------|
| `list_in_app_purchases` | List IAPs (consumables, non-consumables, non-renewing subs). |
| `get_in_app_purchase` | Get one IAP. |
| `create_in_app_purchase` | Create a new IAP. |
| `update_in_app_purchase` | Edit reference name, review note, family sharing. |
| `delete_in_app_purchase` | Delete a draft IAP. |
| `create_in_app_purchase_localization` | Localized name + description. |
| `submit_in_app_purchase_for_review` | Send IAP to App Review. |

### Subscriptions

| Tool | Description |
|------|-------------|
| `list_subscription_groups` | List groups. |
| `create_subscription_group` | Create a new group. |
| `list_subscriptions_in_group` | List subscription tiers. |
| `create_subscription` | Create an auto-renewing subscription tier. |
| `create_subscription_localization` | Localized name + description. |
| `create_subscription_price` | Schedule a price change. |
| `list_subscription_price_points` | Apple subscription price tiers. |
| `create_subscription_introductory_offer` | Free trial / pay-as-you-go / pay-up-front. |
| `submit_subscription_for_review` | Send subscription to review. |

### Submission & Release

| Tool | Description |
|------|-------------|
| `create_app_store_version` | Start a new version draft. |
| `update_app_store_version` | Edit version string, copyright, release type. |
| `delete_app_store_version` | Delete an unsubmitted draft. |
| `attach_build_to_version` | Bind an uploaded build to the version. |
| `create_app_store_review_submission` | Open a review submission. |
| `add_version_to_review_submission` | Attach a version (or IAP, etc.) to the submission. |
| `submit_review_submission` | Final submit to App Review. |
| `create_phased_release` / `update_phased_release` | 7-day phased rollout. |
| `create_app_store_version_release_request` | Manually release an approved version. |

### In-App Events

| Tool | Description |
|------|-------------|
| `list_app_events` | List events by state. |
| `get_app_event` | Get one event. |
| `create_app_event` | Create a draft event with badge, purpose, priority, schedule, territories. |
| `update_app_event` | Edit any attribute or transition state. |
| `submit_app_event_for_review` | Send to App Review (READY_FOR_REVIEW). |
| `archive_app_event` | Archive a past event. |
| `delete_app_event` | Delete a draft event. |
| `list_app_event_localizations` | Per-locale name + descriptions. |
| `create_app_event_localization` | Add a locale (name, short desc, long desc). |
| `update_app_event_localization` | Edit a locale. |
| `delete_app_event_localization` | Remove a locale. |

### Custom Product Pages (CPP)

| Tool | Description |
|------|-------------|
| `list_custom_product_pages` | List CPPs (up to 70 per app). |
| `get_custom_product_page` | Get one CPP. |
| `create_custom_product_page` | Create a new CPP. |
| `update_custom_product_page` | Rename or toggle visibility. |
| `delete_custom_product_page` | Delete a CPP. |
| `list_custom_product_page_versions` | List CPP version drafts and live versions. |
| `create_custom_product_page_version` | Create a new CPP draft version. |
| `list_custom_product_page_localizations` | Per-locale promo text. |
| `create_custom_product_page_localization` | Add a locale with promo text. |
| `update_custom_product_page_localization` | Edit promo text. |
| `list_custom_product_page_screenshot_sets` | Screenshot sets for a CPP locale. |

### Product Page Optimization (PPO / A-B tests)

| Tool | Description |
|------|-------------|
| `list_app_store_version_experiments` | List PPO experiments on a version. |
| `get_app_store_version_experiment` | Get one experiment. |
| `create_app_store_version_experiment` | Create a new experiment with traffic share. |
| `update_app_store_version_experiment` | Adjust traffic, name, or state. |
| `delete_app_store_version_experiment` | Delete a non-running experiment. |
| `list_experiment_treatments` | List treatments (variants, max 3). |
| `create_experiment_treatment` | Create a variant. |
| `update_experiment_treatment` | Rename / re-share treatment traffic. |
| `delete_experiment_treatment` | Delete a treatment. |
| `list_experiment_treatment_localizations` | Per-locale overrides. |
| `create_experiment_treatment_localization` | Add a locale-scoped override. |
| `start_app_store_version_experiment` | Start the experiment. |
| `stop_app_store_version_experiment` | Stop the experiment. |

### Builds

| Tool | Description |
|------|-------------|
| `list_builds` | List builds. Filter by app, version, processing state. |
| `get_build` | Get one build with full details. |
| `list_pre_release_versions` | List TestFlight marketing versions. |

### TestFlight

| Tool | Description |
|------|-------------|
| `list_beta_groups` | List internal & external beta groups. |
| `list_beta_testers` | List testers. Filter by app, group, email. |
| `create_beta_tester` | Invite a tester to one or more groups. |
| `delete_beta_tester` | Remove a tester from your account. |
| `submit_build_for_beta_review` | Submit a build for external TestFlight review. |

### Customer Reviews

| Tool | Description |
|------|-------------|
| `list_customer_reviews` | List reviews. Filter by territory, rating, response status. |
| `get_customer_review` | Get a single review. |
| `respond_to_customer_review` | Publish a developer response. |
| `delete_customer_review_response` | Remove a published response. |

### Sales & Finance Reports

| Tool | Description |
|------|-------------|
| `download_sales_report` | Download a sales / subscription / subscriber report (gzipped TSV, returned base64). |
| `download_finance_report` | Download a finance / proceeds report by region and fiscal month. |

### Team Users

| Tool | Description |
|------|-------------|
| `list_team_users` | List team members and their roles. |
| `get_team_user` | Get one team user. |
| `list_user_invitations` | List pending team invitations. |

## End-to-End Submission Flow

Typical sequence for shipping a new version, all callable from Claude:

1. `create_app_store_version` → version draft.
2. `create_app_store_version_localization` (one per locale) → description, keywords, what's new.
3. `create_screenshot_set` + `upload_screenshot` (per device size, per locale).
4. `update_app_info` → categories.
5. `set_app_price_schedule` + `set_app_availability` → pricing & territories.
6. (Optional) `create_in_app_purchase` / `create_subscription` + their localizations.
7. Upload binary via Transporter / `xcrun altool` (out of API scope), then `attach_build_to_version`.
8. `create_app_store_review_submission` → `add_version_to_review_submission` → `submit_review_submission`.
9. (Optional) `create_phased_release` for staged rollout.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_STORE_CONNECT_KEY_ID` | yes | 10-character Key ID from the API page |
| `APP_STORE_CONNECT_ISSUER_ID` | yes | UUID issuer ID for your account |
| `APP_STORE_CONNECT_PRIVATE_KEY_PATH` | yes\* | Absolute path to the downloaded `.p8` file |
| `APP_STORE_CONNECT_PRIVATE_KEY` | yes\* | OR the key contents (PEM, `\n`-escaped allowed) |
| `APP_STORE_CONNECT_BASE_URL` | no | Override API base URL |
| `APP_STORE_CONNECT_TIMEOUT_MS` | no | Per-request timeout, default `30000` |

\* Provide either `_PATH` or `_PRIVATE_KEY`, not both.

## Security

- Credentials are read from environment variables only. The server never logs the key, never echoes it to stdout, and never sends it to the LLM.
- JWTs are minted in memory with a 20-minute TTL (the Apple maximum) and refreshed automatically.
- All requests use HTTPS to `api.appstoreconnect.apple.com`.
- The `.p8` file should be `chmod 600` and never committed.

Found a vulnerability? See [SECURITY.md](./SECURITY.md).

## Local Development

```bash
git clone https://github.com/pointerflow/appstore-connect-mcp
cd appstore-connect-mcp
npm install
cp .env.example .env
# Fill .env with real credentials
npm run dev      # starts on stdio
npm test         # vitest
npm run build    # tsup → dist/
```

## Contributing

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
