import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerReviewTools(server: McpServer): void {
  server.tool(
    "list_customer_reviews",
    "List customer App Store reviews for an app. Supports filtering by territory and rating.",
    {
      app_id: z.string().describe("App resource ID"),
      limit: z.number().int().min(1).max(200).default(50).describe("Number of reviews to return"),
      filter_territory: z
        .array(z.string().length(3))
        .optional()
        .describe("Filter by 3-letter territory codes e.g. ['USA', 'GBR']"),
      filter_rating: z
        .array(z.enum(["ONE_STAR", "TWO_STARS", "THREE_STARS", "FOUR_STARS", "FIVE_STARS"]))
        .optional()
        .describe("Filter by star rating"),
      sort: z
        .enum(["createdDate", "-createdDate", "rating", "-rating"])
        .default("-createdDate")
        .describe("Sort order. Default newest first."),
      exists_publishedResponse: z
        .boolean()
        .optional()
        .describe("True returns only reviews that already have a developer response"),
    },
    async ({ app_id, limit, filter_territory, filter_rating, sort, exists_publishedResponse }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[territory]": filter_territory,
          "filter[rating]": filter_rating,
          "exists[publishedResponse]": exists_publishedResponse,
          sort,
        });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/customerReviews`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_customer_review",
    "Get a single customer review with full body, rating, and territory.",
    {
      review_id: z.string().describe("Customer review resource ID"),
    },
    async ({ review_id }) => {
      try {
        const { data } = await getApiClient().get(`/v1/customerReviews/${review_id}`);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "respond_to_customer_review",
    "Publish a developer response to a customer review. The response is visible to all App Store users.",
    {
      review_id: z.string().describe("Customer review resource ID to respond to"),
      response_body: z
        .string()
        .min(1)
        .max(5970)
        .describe("Response text. Visible publicly. Max 5970 chars per Apple."),
    },
    async ({ review_id, response_body }) => {
      try {
        const body = {
          data: {
            type: "customerReviewResponses",
            attributes: { responseBody: response_body },
            relationships: {
              review: { data: { type: "customerReviews", id: review_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/customerReviewResponses", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_customer_review_response",
    "Delete a developer response previously published to a customer review.",
    {
      response_id: z.string().describe("Customer review response resource ID"),
    },
    async ({ response_id }) => {
      try {
        await getApiClient().delete(`/v1/customerReviewResponses/${response_id}`);
        return {
          content: [{ type: "text", text: `Review response ${response_id} deleted.` }],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
