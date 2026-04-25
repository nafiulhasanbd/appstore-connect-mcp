import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerTestFlightTools(server: McpServer): void {
  server.tool(
    "list_beta_groups",
    "List TestFlight beta groups (internal and external) for an app or across the account.",
    {
      app_id: z.string().optional().describe("Filter to a specific app resource ID"),
      limit: z.number().int().min(1).max(200).default(20).describe("Number of groups to return"),
      filter_is_internal_group: z
        .boolean()
        .optional()
        .describe("True for internal-only groups, false for external"),
      filter_name: z.string().optional().describe("Filter by group name"),
    },
    async ({ app_id, limit, filter_is_internal_group, filter_name }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[app]": app_id,
          "filter[isInternalGroup]": filter_is_internal_group,
          "filter[name]": filter_name,
        });
        const { data } = await getApiClient().get("/v1/betaGroups", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_beta_testers",
    "List TestFlight beta testers across your account. Filter by app, group, email, or invitation state.",
    {
      limit: z.number().int().min(1).max(200).default(50).describe("Number of testers to return"),
      filter_app: z.string().optional().describe("Filter testers attached to this app ID"),
      filter_beta_group: z.string().optional().describe("Filter testers in this beta group ID"),
      filter_email: z.string().optional().describe("Filter by email address"),
      filter_invite_type: z
        .enum(["EMAIL", "PUBLIC_LINK"])
        .optional()
        .describe("Filter by invitation type"),
    },
    async ({ limit, filter_app, filter_beta_group, filter_email, filter_invite_type }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[apps]": filter_app,
          "filter[betaGroups]": filter_beta_group,
          "filter[email]": filter_email,
          "filter[inviteType]": filter_invite_type,
        });
        const { data } = await getApiClient().get("/v1/betaTesters", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_beta_tester",
    "Invite a new TestFlight tester by email to one or more beta groups.",
    {
      email: z.string().email().describe("Tester email address"),
      first_name: z.string().optional().describe("Tester first name"),
      last_name: z.string().optional().describe("Tester last name"),
      beta_group_ids: z
        .array(z.string())
        .min(1)
        .describe("Beta group resource IDs to add the tester to"),
    },
    async ({ email, first_name, last_name, beta_group_ids }) => {
      try {
        const body = {
          data: {
            type: "betaTesters",
            attributes: {
              email,
              firstName: first_name,
              lastName: last_name,
            },
            relationships: {
              betaGroups: {
                data: beta_group_ids.map((id) => ({ type: "betaGroups", id })),
              },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/betaTesters", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_beta_tester",
    "Remove a TestFlight beta tester from your account permanently.",
    {
      tester_id: z.string().describe("Beta tester resource ID"),
    },
    async ({ tester_id }) => {
      try {
        await getApiClient().delete(`/v1/betaTesters/${tester_id}`);
        return {
          content: [{ type: "text", text: `Beta tester ${tester_id} deleted.` }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "submit_build_for_beta_review",
    "Submit a build for TestFlight external beta review. Required before external testers can install the build.",
    {
      build_id: z.string().describe("Build resource ID to submit"),
    },
    async ({ build_id }) => {
      try {
        const body = {
          data: {
            type: "betaAppReviewSubmissions",
            relationships: {
              build: { data: { type: "builds", id: build_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/betaAppReviewSubmissions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
