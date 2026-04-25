import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

export function registerPricingTools(server: McpServer): void {
  server.tool(
    "get_app_price_schedule",
    "Get the current price schedule for an app — base territory and any scheduled price changes.",
    {
      app_id: z.string().describe("App resource ID"),
      include: z
        .array(z.enum(["baseTerritory", "manualPrices", "automaticPrices"]))
        .optional()
        .describe("Related resources"),
    },
    async ({ app_id, include }) => {
      try {
        const params = buildQueryParams({ include });
        const { data } = await getApiClient().get(`/v1/apps/${app_id}/appPriceSchedule`, {
          params,
        });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "set_app_price_schedule",
    "Replace an app's price schedule. Provide base territory plus list of price entries (each pins price point at start date until next entry).",
    {
      app_id: z.string().describe("App resource ID"),
      base_territory: z
        .string()
        .length(3)
        .describe("Base territory ISO 3-letter code, e.g. 'USA'"),
      manual_prices: z
        .array(
          z.object({
            start_date: z
              .string()
              .optional()
              .describe("ISO date YYYY-MM-DD. Omit for immediate."),
            end_date: z.string().optional().describe("ISO date YYYY-MM-DD. Omit for open-ended."),
            price_point_id: z
              .string()
              .describe("appPricePoint resource ID — fetch via list_app_price_points"),
          })
        )
        .min(1)
        .describe("Ordered list of price periods"),
    },
    async ({ app_id, base_territory, manual_prices }) => {
      try {
        const inlinePrices = manual_prices.map((p, i) => ({
          type: "appPrices",
          id: `\${new-price-${i}}`,
          attributes: {
            startDate: p.start_date,
            endDate: p.end_date,
          },
          relationships: {
            appPricePoint: {
              data: { type: "appPricePoints", id: p.price_point_id },
            },
          },
        }));
        const body = {
          data: {
            type: "appPriceSchedules",
            relationships: {
              app: { data: { type: "apps", id: app_id } },
              baseTerritory: { data: { type: "territories", id: base_territory } },
              manualPrices: {
                data: inlinePrices.map((p) => ({ type: "appPrices", id: p.id })),
              },
            },
          },
          included: inlinePrices,
        };
        const { data } = await getApiClient().post("/v1/appPriceSchedules", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_app_price_points",
    "List Apple's price points (price tiers) — paginated. Use returned IDs in set_app_price_schedule.",
    {
      filter_territory: z.array(z.string()).optional().describe("Filter by territory codes"),
      filter_price_tier: z
        .array(z.string())
        .optional()
        .describe("Filter by price tier identifiers"),
      limit: z.number().int().min(1).max(8000).default(50),
    },
    async ({ filter_territory, filter_price_tier, limit }) => {
      try {
        const params = buildQueryParams({
          limit,
          "filter[territory]": filter_territory,
          "filter[priceTier]": filter_price_tier,
        });
        const { data } = await getApiClient().get("/v2/appPricePoints", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "get_app_availability",
    "Get an app's availability config — which territories it's offered in.",
    {
      app_id: z.string().describe("App resource ID"),
      include: z
        .array(z.enum(["availableTerritories"]))
        .optional()
        .describe("Include territory list inline"),
      limit_available_territories: z.number().int().min(1).max(200).default(200),
    },
    async ({ app_id, include, limit_available_territories }) => {
      try {
        const params = buildQueryParams({
          include,
          "limit[availableTerritories]": limit_available_territories,
        });
        const { data } = await getApiClient().get(`/v2/apps/${app_id}/appAvailabilityV2`, {
          params,
        });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "set_app_availability",
    "Replace an app's available territories. Provide ISO 3-letter codes for every territory you want it offered in.",
    {
      app_id: z.string().describe("App resource ID"),
      available_in_new_territories: z
        .boolean()
        .default(true)
        .describe("Auto-make available in newly added Apple territories"),
      territory_ids: z
        .array(z.string().length(3))
        .min(1)
        .describe("ISO 3-letter territory codes e.g. ['USA','GBR','JPN']"),
    },
    async ({ app_id, available_in_new_territories, territory_ids }) => {
      try {
        const body = {
          data: {
            type: "appAvailabilityCreateV2",
            attributes: {
              availableInNewTerritories: available_in_new_territories,
            },
            relationships: {
              app: { data: { type: "apps", id: app_id } },
              availableTerritories: {
                data: territory_ids.map((id) => ({ type: "territories", id })),
              },
            },
          },
        };
        const { data } = await getApiClient().post("/v2/appAvailabilities", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_territories",
    "List all Apple App Store territories.",
    {
      limit: z.number().int().min(1).max(200).default(200),
    },
    async ({ limit }) => {
      try {
        const params = buildQueryParams({ limit });
        const { data } = await getApiClient().get("/v1/territories", { params });
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
