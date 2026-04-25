import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerLocalizationTools(server: McpServer): void {
  server.tool(
    "list_app_store_version_localizations",
    "List per-locale metadata for an App Store version: description, keywords, promo text, what's new, marketing/support URLs.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      filter_locale: z.array(z.string()).optional().describe("Filter by locale codes"),
    },
    async ({ version_id, filter_locale }) => {
      try {
        const params = buildQueryParams({ "filter[locale]": filter_locale });
        const { data } = await getApiClient().get(
          `/v1/appStoreVersions/${version_id}/appStoreVersionLocalizations`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app_store_version_localization",
    "Get a single version localization (description, keywords, promo text, what's new for one locale).",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
    },
    async ({ localization_id }) => {
      try {
        const { data } = await getApiClient().get(
          `/v1/appStoreVersionLocalizations/${localization_id}`
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_store_version_localization",
    "Add a new locale to an App Store version with description, keywords, promo text, what's new, and URLs.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      locale: z.string().describe("Locale code e.g. 'en-US'"),
      description: z.string().max(4000).optional().describe("App description (max 4000 chars)"),
      keywords: z
        .string()
        .max(100)
        .optional()
        .describe("Comma-separated keywords (max 100 chars total)"),
      promotional_text: z
        .string()
        .max(170)
        .optional()
        .describe("Promotional text (max 170 chars). Editable any time."),
      whats_new: z
        .string()
        .max(4000)
        .optional()
        .describe("Release notes / what's new (max 4000 chars)"),
      marketing_url: z.string().url().optional(),
      support_url: z.string().url().optional(),
    },
    async ({
      version_id,
      locale,
      description,
      keywords,
      promotional_text,
      whats_new,
      marketing_url,
      support_url,
    }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionLocalizations",
            attributes: {
              locale,
              description,
              keywords,
              promotionalText: promotional_text,
              whatsNew: whats_new,
              marketingUrl: marketing_url,
              supportUrl: support_url,
            },
            relationships: {
              appStoreVersion: { data: { type: "appStoreVersions", id: version_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appStoreVersionLocalizations", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_store_version_localization",
    "Update an existing version localization. Use to edit description, keywords, what's new etc.",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
      description: z.string().max(4000).optional(),
      keywords: z.string().max(100).optional(),
      promotional_text: z.string().max(170).optional(),
      whats_new: z.string().max(4000).optional(),
      marketing_url: z.string().url().optional(),
      support_url: z.string().url().optional(),
    },
    async ({
      localization_id,
      description,
      keywords,
      promotional_text,
      whats_new,
      marketing_url,
      support_url,
    }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionLocalizations",
            id: localization_id,
            attributes: {
              description,
              keywords,
              promotionalText: promotional_text,
              whatsNew: whats_new,
              marketingUrl: marketing_url,
              supportUrl: support_url,
            },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appStoreVersionLocalizations/${localization_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_app_store_version_localization",
    "Remove a locale entirely from an App Store version.",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
    },
    async ({ localization_id }) => {
      try {
        await getApiClient().delete(`/v1/appStoreVersionLocalizations/${localization_id}`);
        return {
          content: [{ type: "text", text: `Localization ${localization_id} deleted.` }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
