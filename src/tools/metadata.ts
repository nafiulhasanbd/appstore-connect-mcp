import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerMetadataTools(server: McpServer): void {
  server.tool(
    "list_app_infos",
    "List app info records for an app. Each app has multiple appInfo records — one per editable state. Returns category and content-rights metadata.",
    {
      app_id: z.string().describe("App resource ID"),
      include: z
        .array(
          z.enum([
            "primaryCategory",
            "secondaryCategory",
            "primarySubcategoryOne",
            "primarySubcategoryTwo",
            "secondarySubcategoryOne",
            "secondarySubcategoryTwo",
            "appInfoLocalizations",
          ])
        )
        .optional()
        .describe("Related resources to include"),
    },
    async ({ app_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/appInfos`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_info",
    "Update an app info record — assign primary/secondary categories and subcategories.",
    {
      app_info_id: z.string().describe("appInfo resource ID"),
      primary_category_id: z.string().optional().describe("Primary category resource ID"),
      secondary_category_id: z.string().optional().describe("Secondary category resource ID"),
      primary_subcategory_one_id: z.string().optional(),
      primary_subcategory_two_id: z.string().optional(),
      secondary_subcategory_one_id: z.string().optional(),
      secondary_subcategory_two_id: z.string().optional(),
    },
    async ({
      app_info_id,
      primary_category_id,
      secondary_category_id,
      primary_subcategory_one_id,
      primary_subcategory_two_id,
      secondary_subcategory_one_id,
      secondary_subcategory_two_id,
    }) => {
      try {
        const rel = (id: string | undefined, type: string) =>
          id === undefined ? undefined : { data: id ? { type, id } : null };
        const relationships: Record<string, unknown> = {};
        const map: Array<[string, string | undefined, string]> = [
          ["primaryCategory", primary_category_id, "appCategories"],
          ["secondaryCategory", secondary_category_id, "appCategories"],
          ["primarySubcategoryOne", primary_subcategory_one_id, "appCategories"],
          ["primarySubcategoryTwo", primary_subcategory_two_id, "appCategories"],
          ["secondarySubcategoryOne", secondary_subcategory_one_id, "appCategories"],
          ["secondarySubcategoryTwo", secondary_subcategory_two_id, "appCategories"],
        ];
        for (const [key, id, type] of map) {
          const r = rel(id, type);
          if (r !== undefined) relationships[key] = r;
        }
        const body = {
          data: {
            type: "appInfos",
            id: app_info_id,
            relationships,
          },
        };
        const { data } = await getApiClient().patch(`/v1/appInfos/${app_info_id}`, body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_app_categories",
    "List App Store categories Apple offers, optionally filtered by platform. Use returned IDs in update_app_info.",
    {
      filter_platforms: z
        .array(z.enum(["IOS", "MAC_OS", "TV_OS", "VISION_OS"]))
        .optional()
        .describe("Filter by platforms"),
      include: z
        .array(z.enum(["parent", "subcategories"]))
        .optional()
        .describe("Include parent or subcategories"),
      limit: z.number().int().min(1).max(200).default(200),
    },
    async ({ filter_platforms, include, limit }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[platforms]": filter_platforms,
          include,
        });
        const { data } = await getApiClient().get("/v1/appCategories", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_app_info_localizations",
    "List localized app-info records (per-locale name, subtitle, privacy URL, privacy choices URL).",
    {
      app_info_id: z.string().describe("appInfo resource ID"),
      filter_locale: z.array(z.string()).optional().describe("Filter by locales e.g. ['en-US','fr-FR']"),
    },
    async ({ app_info_id, filter_locale }) => {
      try {
        const params = buildQueryParams({ "filter[locale]": filter_locale });
        const { data } = await getApiClient().get(
          `/v1/appInfos/${app_info_id}/appInfoLocalizations`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_info_localization",
    "Add a new locale to an app info record (sets app name, subtitle, privacy URLs in that locale).",
    {
      app_info_id: z.string().describe("appInfo resource ID"),
      locale: z.string().describe("Locale code e.g. 'en-US', 'fr-FR'"),
      name: z.string().min(1).max(30).optional().describe("Localized app name (max 30 chars)"),
      subtitle: z.string().max(30).optional().describe("Localized subtitle (max 30 chars)"),
      privacy_policy_url: z.string().url().optional(),
      privacy_choices_url: z.string().url().optional(),
      privacy_policy_text: z.string().optional().describe("Used for tvOS apps"),
    },
    async ({
      app_info_id,
      locale,
      name,
      subtitle,
      privacy_policy_url,
      privacy_choices_url,
      privacy_policy_text,
    }) => {
      try {
        const body = {
          data: {
            type: "appInfoLocalizations",
            attributes: {
              locale,
              name,
              subtitle,
              privacyPolicyUrl: privacy_policy_url,
              privacyChoicesUrl: privacy_choices_url,
              privacyPolicyText: privacy_policy_text,
            },
            relationships: {
              appInfo: { data: { type: "appInfos", id: app_info_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appInfoLocalizations", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_info_localization",
    "Update an existing app info localization (name, subtitle, privacy URLs).",
    {
      localization_id: z.string().describe("appInfoLocalization resource ID"),
      name: z.string().min(1).max(30).optional(),
      subtitle: z.string().max(30).optional(),
      privacy_policy_url: z.string().url().optional(),
      privacy_choices_url: z.string().url().optional(),
      privacy_policy_text: z.string().optional(),
    },
    async ({
      localization_id,
      name,
      subtitle,
      privacy_policy_url,
      privacy_choices_url,
      privacy_policy_text,
    }) => {
      try {
        const body = {
          data: {
            type: "appInfoLocalizations",
            id: localization_id,
            attributes: {
              name,
              subtitle,
              privacyPolicyUrl: privacy_policy_url,
              privacyChoicesUrl: privacy_choices_url,
              privacyPolicyText: privacy_policy_text,
            },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appInfoLocalizations/${localization_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
