import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

const IAP_TYPES = ["CONSUMABLE", "NON_CONSUMABLE", "NON_RENEWING_SUBSCRIPTION"] as const;
const IAP_STATES = [
  "MISSING_METADATA",
  "READY_TO_SUBMIT",
  "WAITING_FOR_REVIEW",
  "IN_REVIEW",
  "DEVELOPER_ACTION_NEEDED",
  "PENDING_BINARY_APPROVAL",
  "APPROVED",
  "REJECTED",
  "REMOVED_FROM_SALE",
] as const;

export function registerIapTools(server: McpServer): void {
  server.tool(
    "list_in_app_purchases",
    "List in-app purchases (consumables, non-consumables, non-renewing subs) for an app.",
    {
      app_id: z.string().describe("App resource ID"),
      filter_in_app_purchase_type: z
        .array(z.enum(IAP_TYPES))
        .optional()
        .describe("Filter by IAP type"),
      filter_state: z.array(z.enum(IAP_STATES)).optional().describe("Filter by state"),
      limit: z.number().int().min(1).max(200).default(50),
    },
    async ({ app_id, filter_in_app_purchase_type, filter_state, limit }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[inAppPurchaseType]": filter_in_app_purchase_type,
          "filter[state]": filter_state,
        });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/inAppPurchasesV2`, {
          params,
        });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_in_app_purchase",
    "Get a single in-app purchase with full details, including state and pricing.",
    {
      iap_id: z.string().describe("inAppPurchaseV2 resource ID"),
      include: z
        .array(
          z.enum([
            "appStoreReviewScreenshot",
            "content",
            "iapPriceSchedule",
            "inAppPurchaseLocalizations",
            "pricePoints",
            "promotedPurchase",
          ])
        )
        .optional(),
    },
    async ({ iap_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v2/inAppPurchases/${iap_id}`, { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_in_app_purchase",
    "Create a new in-app purchase (consumable, non-consumable, or non-renewing subscription).",
    {
      app_id: z.string().describe("App resource ID"),
      product_id: z
        .string()
        .min(1)
        .describe("Product ID, e.g. 'com.acme.app.coins.100'. Must be unique per team."),
      reference_name: z.string().min(1).max(64).describe("Internal name (max 64 chars)"),
      in_app_purchase_type: z.enum(IAP_TYPES),
      review_note: z.string().max(4000).optional().describe("Notes for App Review"),
      family_sharable: z.boolean().optional().describe("Allow Family Sharing"),
    },
    async ({
      app_id,
      product_id,
      reference_name,
      in_app_purchase_type,
      review_note,
      family_sharable,
    }) => {
      try {
        const body = {
          data: {
            type: "inAppPurchases",
            attributes: {
              productId: product_id,
              referenceName: reference_name,
              inAppPurchaseType: in_app_purchase_type,
              reviewNote: review_note,
              familySharable: family_sharable,
            },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v2/inAppPurchases", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "update_in_app_purchase",
    "Update an existing in-app purchase reference name, review note, or family sharing flag.",
    {
      iap_id: z.string().describe("inAppPurchase resource ID"),
      reference_name: z.string().min(1).max(64).optional(),
      review_note: z.string().max(4000).optional(),
      family_sharable: z.boolean().optional(),
    },
    async ({ iap_id, reference_name, review_note, family_sharable }) => {
      try {
        const body = {
          data: {
            type: "inAppPurchases",
            id: iap_id,
            attributes: {
              referenceName: reference_name,
              reviewNote: review_note,
              familySharable: family_sharable,
            },
          },
        };
        const { data } = await getApiClient().patch(`/v2/inAppPurchases/${iap_id}`, body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_in_app_purchase",
    "Delete a draft in-app purchase. Approved IAPs can only be removed from sale, not deleted.",
    {
      iap_id: z.string().describe("inAppPurchase resource ID"),
    },
    async ({ iap_id }) => {
      try {
        await getApiClient().delete(`/v2/inAppPurchases/${iap_id}`);
        return { content: [{ type: "text", text: `In-app purchase ${iap_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_in_app_purchase_localization",
    "Add a locale to an IAP with localized name and description.",
    {
      iap_id: z.string().describe("inAppPurchase resource ID"),
      locale: z.string().describe("Locale code, e.g. 'en-US'"),
      name: z.string().min(1).max(30).describe("Localized display name (max 30 chars)"),
      description: z
        .string()
        .max(45)
        .optional()
        .describe("Localized description (max 45 chars)"),
    },
    async ({ iap_id, locale, name, description }) => {
      try {
        const body = {
          data: {
            type: "inAppPurchaseLocalizations",
            attributes: { locale, name, description },
            relationships: {
              inAppPurchaseV2: { data: { type: "inAppPurchases", id: iap_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/inAppPurchaseLocalizations", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "submit_in_app_purchase_for_review",
    "Submit an IAP for App Review.",
    {
      iap_id: z.string().describe("inAppPurchase resource ID"),
    },
    async ({ iap_id }) => {
      try {
        const body = {
          data: {
            type: "inAppPurchaseSubmissions",
            relationships: {
              inAppPurchaseV2: { data: { type: "inAppPurchases", id: iap_id } },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/inAppPurchaseSubmissions", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
