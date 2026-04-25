import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerCustomProductPageTools(server: McpServer): void {
  server.tool(
    "list_custom_product_pages",
    "List Custom Product Pages (CPPs) for an app. Up to 70 per app.",
    {
      app_id: z.string().describe("App resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      filter_visible: z.boolean().optional().describe("True for live CPPs only"),
      include: z
        .array(z.enum(["appCustomProductPageVersions", "app"]))
        .optional(),
    },
    async ({ app_id, limit, filter_visible, include }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[visible]": filter_visible,
          include,
        });
        const { data } = await getApiClient().get(
          `/v1/apps/${app_id}/appCustomProductPages`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_custom_product_page",
    "Get a single Custom Product Page with its versions.",
    {
      cpp_id: z.string().describe("appCustomProductPage resource ID"),
      include: z
        .array(z.enum(["appCustomProductPageVersions", "app"]))
        .optional(),
    },
    async ({ cpp_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(
          `/v1/appCustomProductPages/${cpp_id}`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_custom_product_page",
    "Create a new Custom Product Page on an app.",
    {
      app_id: z.string().describe("App resource ID"),
      name: z.string().min(1).max(64).describe("Internal name (max 64 chars)"),
    },
    async ({ app_id, name }) => {
      try {
        const body = {
          data: {
            type: "appCustomProductPages",
            attributes: { name },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appCustomProductPages", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_custom_product_page",
    "Rename or toggle visibility of a Custom Product Page.",
    {
      cpp_id: z.string().describe("appCustomProductPage resource ID"),
      name: z.string().min(1).max(64).optional(),
      visible: z.boolean().optional().describe("Make page live or hide"),
    },
    async ({ cpp_id, name, visible }) => {
      try {
        const body = {
          data: {
            type: "appCustomProductPages",
            id: cpp_id,
            attributes: { name, visible },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appCustomProductPages/${cpp_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_custom_product_page",
    "Permanently delete a Custom Product Page.",
    {
      cpp_id: z.string().describe("appCustomProductPage resource ID"),
    },
    async ({ cpp_id }) => {
      try {
        await getApiClient().delete(`/v1/appCustomProductPages/${cpp_id}`);
        return { content: [{ type: "text", text: `Custom Product Page ${cpp_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_custom_product_page_versions",
    "List versions of a Custom Product Page (PREPARE_FOR_SUBMISSION, IN_REVIEW, LIVE, etc.).",
    {
      cpp_id: z.string().describe("appCustomProductPage resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      filter_state: z
        .array(
          z.enum([
            "PREPARE_FOR_SUBMISSION",
            "READY_FOR_REVIEW",
            "WAITING_FOR_REVIEW",
            "IN_REVIEW",
            "ACCEPTED",
            "APPROVED",
            "REJECTED",
            "REPLACED_WITH_NEW_VERSION",
          ])
        )
        .optional(),
      include: z
        .array(z.enum(["appCustomProductPageLocalizations", "appCustomProductPage"]))
        .optional(),
    },
    async ({ cpp_id, limit, filter_state, include }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[state]": filter_state,
          include,
        });
        const { data } = await getApiClient().get(
          `/v1/appCustomProductPages/${cpp_id}/appCustomProductPageVersions`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_custom_product_page_version",
    "Create a new draft version of a Custom Product Page. Then add localizations + screenshots.",
    {
      cpp_id: z.string().describe("appCustomProductPage resource ID"),
    },
    async ({ cpp_id }) => {
      try {
        const body = {
          data: {
            type: "appCustomProductPageVersions",
            relationships: {
              appCustomProductPage: {
                data: { type: "appCustomProductPages", id: cpp_id },
              },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appCustomProductPageVersions",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_custom_product_page_localizations",
    "List per-locale promo text for a CPP version.",
    {
      cpp_version_id: z.string().describe("appCustomProductPageVersion resource ID"),
      filter_locale: z.array(z.string()).optional(),
    },
    async ({ cpp_version_id, filter_locale }) => {
      try {
        const params = buildQueryParams({ "filter[locale]": filter_locale });
        const { data } = await getApiClient().get(
          `/v1/appCustomProductPageVersions/${cpp_version_id}/appCustomProductPageLocalizations`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_custom_product_page_localization",
    "Add a locale to a CPP version with promotional text.",
    {
      cpp_version_id: z.string().describe("appCustomProductPageVersion resource ID"),
      locale: z.string().describe("Locale code e.g. 'en-US'"),
      promotional_text: z
        .string()
        .max(170)
        .optional()
        .describe("Promo text shown on this CPP (max 170 chars)"),
    },
    async ({ cpp_version_id, locale, promotional_text }) => {
      try {
        const body = {
          data: {
            type: "appCustomProductPageLocalizations",
            attributes: { locale, promotionalText: promotional_text },
            relationships: {
              appCustomProductPageVersion: {
                data: {
                  type: "appCustomProductPageVersions",
                  id: cpp_version_id,
                },
              },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appCustomProductPageLocalizations",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_custom_product_page_localization",
    "Update promo text on a CPP localization.",
    {
      localization_id: z.string().describe("appCustomProductPageLocalization resource ID"),
      promotional_text: z.string().max(170).optional(),
    },
    async ({ localization_id, promotional_text }) => {
      try {
        const body = {
          data: {
            type: "appCustomProductPageLocalizations",
            id: localization_id,
            attributes: { promotionalText: promotional_text },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appCustomProductPageLocalizations/${localization_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_custom_product_page_screenshot_sets",
    "List screenshot sets on a CPP localization. Same shape as main app screenshots — use upload_screenshot via the returned set ID via create_screenshot_set_for_cpp.",
    {
      localization_id: z.string().describe("appCustomProductPageLocalization resource ID"),
    },
    async ({ localization_id }) => {
      try {
        const { data } = await getApiClient().get(
          `/v1/appCustomProductPageLocalizations/${localization_id}/appScreenshotSets`
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
