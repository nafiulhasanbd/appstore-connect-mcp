import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

const DURATION = [
  "ONE_WEEK",
  "ONE_MONTH",
  "TWO_MONTHS",
  "THREE_MONTHS",
  "SIX_MONTHS",
  "ONE_YEAR",
] as const;

const OFFER_MODE = ["FREE_TRIAL", "PAY_AS_YOU_GO", "PAY_UP_FRONT"] as const;

const NUM_PERIODS = ["ONE", "TWO", "THREE", "SIX", "TWELVE"] as const;

export function registerSubscriptionTools(server: McpServer): void {
  server.tool(
    "list_subscription_groups",
    "List subscription groups for an app. A group bundles tiers a user can switch between.",
    {
      app_id: z.string().describe("App resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      include: z
        .array(z.enum(["subscriptions", "subscriptionGroupLocalizations"]))
        .optional(),
    },
    async ({ app_id, limit, include }) => {
      try {
        const params = buildQueryParams({ limit, include });
        const { data } = await getApiClient().get(
          `/v1/apps/${app_id}/subscriptionGroups`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_subscription_group",
    "Create a new subscription group on an app.",
    {
      app_id: z.string().describe("App resource ID"),
      reference_name: z.string().min(1).max(96).describe("Internal name (max 96 chars)"),
    },
    async ({ app_id, reference_name }) => {
      try {
        const body = {
          data: {
            type: "subscriptionGroups",
            attributes: { referenceName: reference_name },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/subscriptionGroups", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_subscriptions_in_group",
    "List subscriptions (tiers) in a subscription group.",
    {
      group_id: z.string().describe("subscriptionGroup resource ID"),
      limit: z.number().int().min(1).max(200).default(50),
      include: z
        .array(
          z.enum([
            "subscriptionLocalizations",
            "appStoreReviewScreenshot",
            "introductoryOffers",
            "promotionalOffers",
            "prices",
          ])
        )
        .optional(),
    },
    async ({ group_id, limit, include }) => {
      try {
        const params = buildQueryParams({ limit, include });
        const { data } = await getApiClient().get(
          `/v1/subscriptionGroups/${group_id}/subscriptions`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_subscription",
    "Create a new auto-renewing subscription tier inside a group.",
    {
      group_id: z.string().describe("subscriptionGroup resource ID"),
      product_id: z
        .string()
        .min(1)
        .describe("Product ID e.g. 'com.acme.app.pro.monthly'"),
      reference_name: z.string().min(1).max(64),
      subscription_period: z.enum(DURATION).describe("Billing period"),
      family_sharable: z.boolean().optional(),
      group_level: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Tier rank within group. 1 = highest. Determines upgrade/downgrade hierarchy."),
      review_note: z.string().max(4000).optional(),
    },
    async ({
      group_id,
      product_id,
      reference_name,
      subscription_period,
      family_sharable,
      group_level,
      review_note,
    }) => {
      try {
        const body = {
          data: {
            type: "subscriptions",
            attributes: {
              productId: product_id,
              referenceName: reference_name,
              subscriptionPeriod: subscription_period,
              familySharable: family_sharable,
              groupLevel: group_level,
              reviewNote: review_note,
            },
            relationships: {
              group: { data: { type: "subscriptionGroups", id: group_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/subscriptions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_subscription_localization",
    "Add a localized name/description for a subscription.",
    {
      subscription_id: z.string().describe("subscription resource ID"),
      locale: z.string().describe("Locale code"),
      name: z.string().min(1).max(30).describe("Display name (max 30 chars)"),
      description: z.string().max(45).optional().describe("Description (max 45 chars)"),
    },
    async ({ subscription_id, locale, name, description }) => {
      try {
        const body = {
          data: {
            type: "subscriptionLocalizations",
            attributes: { locale, name, description },
            relationships: {
              subscription: { data: { type: "subscriptions", id: subscription_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/subscriptionLocalizations", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_subscription_price",
    "Set or schedule a price for a subscription in a territory. Pass an existing pricePoint ID and start date.",
    {
      subscription_id: z.string().describe("subscription resource ID"),
      price_point_id: z.string().describe("subscriptionPricePoint resource ID"),
      start_date: z
        .string()
        .optional()
        .describe("ISO date YYYY-MM-DD. Omit for immediate."),
      preserve_current_price: z
        .boolean()
        .optional()
        .describe("Preserve existing subscriber price"),
    },
    async ({ subscription_id, price_point_id, start_date, preserve_current_price }) => {
      try {
        const body = {
          data: {
            type: "subscriptionPrices",
            attributes: {
              startDate: start_date,
              preserveCurrentPrice: preserve_current_price,
            },
            relationships: {
              subscription: { data: { type: "subscriptions", id: subscription_id } },
              subscriptionPricePoint: {
                data: { type: "subscriptionPricePoints", id: price_point_id },
              },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/subscriptionPrices", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_subscription_price_points",
    "List Apple subscription price points for a subscription. Use IDs in create_subscription_price.",
    {
      subscription_id: z.string().describe("subscription resource ID"),
      filter_territory: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(8000).default(50),
    },
    async ({ subscription_id, filter_territory, limit }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[territory]": filter_territory,
        });
        const { data } = await getApiClient().get(
          `/v1/subscriptions/${subscription_id}/pricePoints`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_subscription_introductory_offer",
    "Create an intro offer (free trial / pay-as-you-go / pay-up-front) for new or eligible subscribers.",
    {
      subscription_id: z.string().describe("subscription resource ID"),
      offer_mode: z.enum(OFFER_MODE).describe("Offer type"),
      duration: z.enum(DURATION).describe("Offer billing period"),
      number_of_periods: z.enum(NUM_PERIODS).describe("Number of offer periods"),
      territory_code: z.string().length(3).describe("Territory ISO 3-letter code"),
      start_date: z.string().optional().describe("ISO date YYYY-MM-DD"),
      end_date: z.string().optional().describe("ISO date YYYY-MM-DD"),
      subscription_price_point_id: z
        .string()
        .optional()
        .describe("Price point for paid intro offers"),
    },
    async ({
      subscription_id,
      offer_mode,
      duration,
      number_of_periods,
      territory_code,
      start_date,
      end_date,
      subscription_price_point_id,
    }) => {
      try {
        const relationships: Record<string, unknown> = {
          subscription: { data: { type: "subscriptions", id: subscription_id } },
          territory: { data: { type: "territories", id: territory_code } },
        };
        if (subscription_price_point_id) {
          relationships.subscriptionPricePoint = {
            data: { type: "subscriptionPricePoints", id: subscription_price_point_id },
          };
        }
        const body = {
          data: {
            type: "subscriptionIntroductoryOffers",
            attributes: {
              offerMode: offer_mode,
              duration,
              numberOfPeriods: number_of_periods,
              startDate: start_date,
              endDate: end_date,
            },
            relationships,
          },
        };
        const { data } = await getApiClient().post(
          "/v1/subscriptionIntroductoryOffers",
          body
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "submit_subscription_for_review",
    "Submit a subscription for App Review (after metadata, screenshot, and pricing are set).",
    {
      subscription_id: z.string().describe("subscription resource ID"),
    },
    async ({ subscription_id }) => {
      try {
        const body = {
          data: {
            type: "subscriptionSubmissions",
            relationships: {
              subscription: { data: { type: "subscriptions", id: subscription_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/subscriptionSubmissions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
