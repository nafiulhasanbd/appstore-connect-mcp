import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerAppTools(server: McpServer): void {
  server.tool(
    "list_apps",
    "List all apps in your App Store Connect account. Supports filtering by bundle ID, name, SKU, and pagination.",
    {
      limit: z.number().int().min(1).max(200).default(20).describe("Number of apps to return (max 200)"),
      filter_bundle_id: z.string().optional().describe("Filter by exact bundle ID e.g. com.example.app"),
      filter_name: z.string().optional().describe("Filter by app name (partial match)"),
      filter_sku: z.string().optional().describe("Filter by SKU"),
      sort: z
        .enum(["name", "-name", "bundleId", "-bundleId"])
        .optional()
        .describe("Sort order. Prefix with '-' for descending."),
    },
    async ({ limit, filter_bundle_id, filter_name, filter_sku, sort }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[bundleId]": filter_bundle_id,
          "filter[name]": filter_name,
          "filter[sku]": filter_sku,
          sort,
        });
        const { data } = await getApiClient().get("/v1/apps", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app",
    "Get full details for a single app by its App Store Connect resource ID.",
    {
      app_id: z.string().describe("The App Store Connect app resource ID"),
      include: z
        .array(z.enum(["appStoreVersions", "builds", "betaGroups", "preReleaseVersions", "appInfos"]))
        .optional()
        .describe("Related resources to include in the response"),
    },
    async ({ app_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_app_store_versions",
    "List App Store versions for an app. Useful to see which versions are in review, ready for sale, rejected, etc.",
    {
      app_id: z.string().describe("The app resource ID"),
      limit: z.number().int().min(1).max(200).default(20).describe("Number of versions to return"),
      filter_platform: z
        .enum(["IOS", "MAC_OS", "TV_OS", "VISION_OS"])
        .optional()
        .describe("Filter by platform"),
      filter_app_store_state: z
        .array(
          z.enum([
            "DEVELOPER_REMOVED_FROM_SALE",
            "DEVELOPER_REJECTED",
            "IN_REVIEW",
            "INVALID_BINARY",
            "METADATA_REJECTED",
            "PENDING_APPLE_RELEASE",
            "PENDING_CONTRACT",
            "PENDING_DEVELOPER_RELEASE",
            "PREPARE_FOR_SUBMISSION",
            "PREORDER_READY_FOR_SALE",
            "PROCESSING_FOR_APP_STORE",
            "READY_FOR_SALE",
            "REJECTED",
            "REMOVED_FROM_SALE",
            "WAITING_FOR_EXPORT_COMPLIANCE",
            "WAITING_FOR_REVIEW",
            "REPLACED_WITH_NEW_VERSION",
          ])
        )
        .optional()
        .describe("Filter by App Store states"),
    },
    async ({ app_id, limit, filter_platform, filter_app_store_state }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[platform]": filter_platform,
          "filter[appStoreState]": filter_app_store_state,
        });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/appStoreVersions`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app_store_version",
    "Get a single App Store version by its resource ID, including state, release type, and version string.",
    {
      version_id: z.string().describe("The appStoreVersion resource ID"),
    },
    async ({ version_id }) => {
      try {
        const { data } = await getApiClient().get(`/v1/appStoreVersions/${version_id}`);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
