import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerUserTools(server: McpServer): void {
  server.tool(
    "list_team_users",
    "List App Store Connect team users (your Apple Developer team members), with their roles and app access.",
    {
      limit: z.number().int().min(1).max(200).default(50).describe("Number of users to return"),
      filter_username: z.string().optional().describe("Filter by username (Apple ID email)"),
      filter_roles: z
        .array(
          z.enum([
            "ADMIN",
            "FINANCE",
            "ACCOUNT_HOLDER",
            "SALES",
            "MARKETING",
            "APP_MANAGER",
            "DEVELOPER",
            "ACCESS_TO_REPORTS",
            "CUSTOMER_SUPPORT",
            "CREATE_APPS",
            "CLOUD_MANAGED_DEVELOPER_ID",
            "CLOUD_MANAGED_APP_DISTRIBUTION",
          ])
        )
        .optional()
        .describe("Filter by team role"),
      filter_visible_apps: z
        .array(z.string())
        .optional()
        .describe("Filter to users with access to these app IDs"),
    },
    async ({ limit, filter_username, filter_roles, filter_visible_apps }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[username]": filter_username,
          "filter[roles]": filter_roles,
          "filter[visibleApps]": filter_visible_apps,
        });
        const { data } = await getApiClient().get("/v1/users", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_team_user",
    "Get a single App Store Connect team user by ID, including roles and app visibility.",
    {
      user_id: z.string().describe("Team user resource ID"),
    },
    async ({ user_id }) => {
      try {
        const { data } = await getApiClient().get(`/v1/users/${user_id}`);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_user_invitations",
    "List pending invitations to your App Store Connect team.",
    {
      limit: z.number().int().min(1).max(200).default(50).describe("Number of invitations to return"),
      filter_email: z.string().optional().describe("Filter by invitee email"),
    },
    async ({ limit, filter_email }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[email]": filter_email,
        });
        const { data } = await getApiClient().get("/v1/userInvitations", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
