import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerBuildTools(server: McpServer): void {
  server.tool(
    "list_builds",
    "List builds across your account or filtered to a specific app. Shows processing state, version, and upload date.",
    {
      limit: z.number().int().min(1).max(200).default(20).describe("Number of builds to return"),
      filter_app: z.string().optional().describe("Filter to a specific app resource ID"),
      filter_version: z.string().optional().describe("Filter by build number e.g. '42'"),
      filter_pre_release_version_version: z
        .string()
        .optional()
        .describe("Filter by marketing version e.g. '1.2.0'"),
      filter_processing_state: z
        .array(z.enum(["PROCESSING", "FAILED", "INVALID", "VALID"]))
        .optional()
        .describe("Filter by processing state"),
      filter_expired: z.boolean().optional().describe("Filter expired builds"),
      sort: z
        .enum(["uploadedDate", "-uploadedDate", "version", "-version"])
        .default("-uploadedDate")
        .describe("Sort order"),
    },
    async ({
      limit,
      filter_app,
      filter_version,
      filter_pre_release_version_version,
      filter_processing_state,
      filter_expired,
      sort,
    }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[app]": filter_app,
          "filter[version]": filter_version,
          "filter[preReleaseVersion.version]": filter_pre_release_version_version,
          "filter[processingState]": filter_processing_state,
          "filter[expired]": filter_expired,
          sort,
        });
        const { data } = await getApiClient().get("/v1/builds", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_build",
    "Get full details for a single build, including processing state, expiration date, and uploaded date.",
    {
      build_id: z.string().describe("The build resource ID"),
      include: z
        .array(
          z.enum([
            "app",
            "appStoreVersion",
            "preReleaseVersion",
            "betaGroups",
            "betaBuildLocalizations",
            "icons",
          ])
        )
        .optional()
        .describe("Related resources to include"),
    },
    async ({ build_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v1/builds/${build_id}`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_pre_release_versions",
    "List pre-release (TestFlight) versions for an app. Each version groups its builds by marketing version.",
    {
      app_id: z.string().optional().describe("Filter to a specific app resource ID"),
      limit: z.number().int().min(1).max(200).default(20).describe("Number of versions to return"),
      filter_platform: z
        .enum(["IOS", "MAC_OS", "TV_OS", "VISION_OS"])
        .optional()
        .describe("Filter by platform"),
    },
    async ({ app_id, limit, filter_platform }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[app]": app_id,
          "filter[platform]": filter_platform,
        });
        const { data } = await getApiClient().get("/v1/preReleaseVersions", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
