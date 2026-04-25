import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText } from "../utils/formatters.js";

const PLATFORM = ["IOS", "MAC_OS", "TV_OS", "VISION_OS"] as const;
const RELEASE_TYPE = ["MANUAL", "AFTER_APPROVAL", "SCHEDULED"] as const;

export function registerSubmissionTools(server: McpServer): void {
  server.tool(
    "create_app_store_version",
    "Create a new App Store version draft for an app. After creation, add localizations, screenshots, attach a build, then submit.",
    {
      app_id: z.string().describe("App resource ID"),
      version_string: z
        .string()
        .min(1)
        .describe("Marketing version, e.g. '1.4.0'"),
      platform: z.enum(PLATFORM).describe("Target platform"),
      copyright: z.string().max(2000).optional().describe("Copyright text"),
      release_type: z.enum(RELEASE_TYPE).optional().describe("Release type"),
      earliest_release_date: z
        .string()
        .optional()
        .describe("Required when release_type=SCHEDULED. ISO 8601 datetime."),
    },
    async ({
      app_id,
      version_string,
      platform,
      copyright,
      release_type,
      earliest_release_date,
    }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersions",
            attributes: {
              versionString: version_string,
              platform,
              copyright,
              releaseType: release_type,
              earliestReleaseDate: earliest_release_date,
            },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appStoreVersions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_app_store_version",
    "Update an App Store version draft (version string, copyright, release type).",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      version_string: z.string().min(1).optional(),
      copyright: z.string().max(2000).optional(),
      release_type: z.enum(RELEASE_TYPE).optional(),
      earliest_release_date: z.string().optional(),
      downloadable: z.boolean().optional().describe("Whether build is downloadable from TestFlight"),
    },
    async ({
      version_id,
      version_string,
      copyright,
      release_type,
      earliest_release_date,
      downloadable,
    }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersions",
            id: version_id,
            attributes: {
              versionString: version_string,
              copyright,
              releaseType: release_type,
              earliestReleaseDate: earliest_release_date,
              downloadable,
            },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appStoreVersions/${version_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_app_store_version",
    "Delete an unsubmitted App Store version draft.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
    },
    async ({ version_id }) => {
      try {
        await getApiClient().delete(`/v1/appStoreVersions/${version_id}`);
        return { content: [{ type: "text", text: `Version ${version_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "attach_build_to_version",
    "Attach an uploaded build to an App Store version. Required before submission.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      build_id: z.string().describe("build resource ID"),
    },
    async ({ version_id, build_id }) => {
      try {
        const body = {
          data: { type: "builds", id: build_id },
        };
        await getApiClient().patch(
          `/v1/appStoreVersions/${version_id}/relationships/build`,
          body
        );
        return {
          content: [
            { type: "text", text: `Build ${build_id} attached to version ${version_id}.` },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_store_review_submission",
    "Open a new App Store review submission for an app + platform. Then add the version with add_version_to_review_submission, then submit_review_submission.",
    {
      app_id: z.string().describe("App resource ID"),
      platform: z.enum(PLATFORM),
    },
    async ({ app_id, platform }) => {
      try {
        const body = {
          data: {
            type: "reviewSubmissions",
            attributes: { platform },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/reviewSubmissions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "add_version_to_review_submission",
    "Add an App Store version (or IAP, subscription, etc.) as an item to a review submission.",
    {
      review_submission_id: z.string().describe("reviewSubmission resource ID"),
      app_store_version_id: z.string().optional(),
      app_custom_product_page_version_id: z.string().optional(),
      app_event_id: z.string().optional(),
      in_app_purchase_v2_id: z.string().optional(),
    },
    async ({
      review_submission_id,
      app_store_version_id,
      app_custom_product_page_version_id,
      app_event_id,
      in_app_purchase_v2_id,
    }) => {
      try {
        const relationships: Record<string, unknown> = {
          reviewSubmission: {
            data: { type: "reviewSubmissions", id: review_submission_id },
          },
        };
        if (app_store_version_id) {
          relationships.appStoreVersion = {
            data: { type: "appStoreVersions", id: app_store_version_id },
          };
        }
        if (app_custom_product_page_version_id) {
          relationships.appCustomProductPageVersion = {
            data: {
              type: "appCustomProductPageVersions",
              id: app_custom_product_page_version_id,
            },
          };
        }
        if (app_event_id) {
          relationships.appEvent = { data: { type: "appEvents", id: app_event_id } };
        }
        if (in_app_purchase_v2_id) {
          relationships.inAppPurchaseV2 = {
            data: { type: "inAppPurchases", id: in_app_purchase_v2_id },
          };
        }
        const body = {
          data: {
            type: "reviewSubmissionItems",
            relationships,
          },
        };
        const { data } = await getApiClient().post("/v1/reviewSubmissionItems", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "submit_review_submission",
    "Finalize a review submission — sends everything attached to App Review.",
    {
      review_submission_id: z.string().describe("reviewSubmission resource ID"),
    },
    async ({ review_submission_id }) => {
      try {
        const body = {
          data: {
            type: "reviewSubmissions",
            id: review_submission_id,
            attributes: { submitted: true },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/reviewSubmissions/${review_submission_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_phased_release",
    "Enable 7-day phased release for an App Store version. Pause/resume/complete after.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
      phased_release_state: z
        .enum([
          "INACTIVE",
          "ACTIVE",
          "PAUSED",
          "COMPLETE",
        ])
        .default("INACTIVE")
        .describe("Initial state. Apple starts a new phased release in INACTIVE."),
    },
    async ({ version_id, phased_release_state }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionPhasedReleases",
            attributes: { phasedReleaseState: phased_release_state },
            relationships: {
              appStoreVersion: { data: { type: "appStoreVersions", id: version_id } },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appStoreVersionPhasedReleases",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_phased_release",
    "Update a phased release state (PAUSED, ACTIVE, COMPLETE).",
    {
      phased_release_id: z.string().describe("appStoreVersionPhasedRelease resource ID"),
      phased_release_state: z.enum(["INACTIVE", "ACTIVE", "PAUSED", "COMPLETE"]),
    },
    async ({ phased_release_id, phased_release_state }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionPhasedReleases",
            id: phased_release_id,
            attributes: { phasedReleaseState: phased_release_state },
          },
        };
        const { data } = await getApiClient().patch(
          `/v1/appStoreVersionPhasedReleases/${phased_release_id}`,
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_app_store_version_release_request",
    "Manually trigger release of an approved version that is set to release manually.",
    {
      version_id: z.string().describe("appStoreVersion resource ID"),
    },
    async ({ version_id }) => {
      try {
        const body = {
          data: {
            type: "appStoreVersionReleaseRequests",
            relationships: {
              appStoreVersion: { data: { type: "appStoreVersions", id: version_id } },
            },
          },
        };
        const { data } = await getApiClient().post(
          "/v1/appStoreVersionReleaseRequests",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
