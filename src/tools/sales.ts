import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { buildQueryParams } from "../utils/formatters.js";

export function registerSalesTools(server: McpServer): void {
  server.tool(
    "download_sales_report",
    "Download a sales or financial report from App Store Connect. Returns the raw report (gzipped TSV) as base64. The Apple endpoint accepts only one report combination per request.",
    {
      vendor_number: z
        .string()
        .min(1)
        .describe("Your vendor number from App Store Connect → Payments and Financial Reports"),
      report_type: z
        .enum([
          "SALES",
          "PRE_ORDER",
          "NEWSSTAND",
          "SUBSCRIPTION",
          "SUBSCRIPTION_EVENT",
          "SUBSCRIBER",
          "SUBSCRIPTION_OFFER_CODE_REDEMPTION",
        ])
        .default("SALES")
        .describe("Type of report"),
      report_sub_type: z
        .enum(["SUMMARY", "DETAILED", "OPT_IN"])
        .default("SUMMARY")
        .describe("Report sub type"),
      frequency: z
        .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
        .default("DAILY")
        .describe("Report frequency"),
      report_date: z
        .string()
        .regex(/^\d{4}(-\d{2}){0,2}$/)
        .describe(
          "Report date. DAILY: YYYY-MM-DD. WEEKLY: YYYY-MM-DD (week ending Sunday). MONTHLY: YYYY-MM. YEARLY: YYYY."
        ),
      version: z
        .string()
        .optional()
        .describe("Report version. Defaults differ per type — see Apple docs."),
    },
    async ({ vendor_number, report_type, report_sub_type, frequency, report_date, version }) => {
      try {
        const params = buildQueryParams({
          "filter[vendorNumber]": vendor_number,
          "filter[reportType]": report_type,
          "filter[reportSubType]": report_sub_type,
          "filter[frequency]": frequency,
          "filter[reportDate]": report_date,
          "filter[version]": version,
        });
        const response = await getApiClient().get("/v1/salesReports", {
          params,
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        const base64 = buffer.toString("base64");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  contentType: response.headers["content-type"] ?? "application/a-gzip",
                  byteLength: buffer.byteLength,
                  encoding: "base64",
                  note: "Body is gzipped TSV. Decode base64, then gunzip to read.",
                  data: base64,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "download_finance_report",
    "Download a finance report (proceeds) for a specific region and period. Returns gzipped CSV as base64.",
    {
      vendor_number: z.string().min(1).describe("Your vendor number"),
      region_code: z
        .string()
        .min(2)
        .max(3)
        .describe("Region code, e.g. 'US', 'Z1' for combined regions. See Apple docs."),
      report_date: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .describe("Fiscal month YYYY-MM"),
      report_type: z.enum(["FINANCIAL", "FINANCE_DETAIL"]).default("FINANCIAL"),
    },
    async ({ vendor_number, region_code, report_date, report_type }) => {
      try {
        const params = buildQueryParams({
          "filter[vendorNumber]": vendor_number,
          "filter[regionCode]": region_code,
          "filter[reportDate]": report_date,
          "filter[reportType]": report_type,
        });
        const response = await getApiClient().get("/v1/financeReports", {
          params,
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  contentType: response.headers["content-type"] ?? "application/a-gzip",
                  byteLength: buffer.byteLength,
                  encoding: "base64",
                  data: buffer.toString("base64"),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
