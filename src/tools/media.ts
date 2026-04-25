import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import axios from "axios";
import { getApiClient } from "../api/client.js";
import { formatError } from "../utils/errors.js";
import { jsonText, buildQueryParams } from "../utils/formatters.js";

const SCREENSHOT_DISPLAY_TYPES = [
  "APP_IPHONE_67",
  "APP_IPHONE_65",
  "APP_IPHONE_61",
  "APP_IPHONE_58",
  "APP_IPHONE_55",
  "APP_IPHONE_47",
  "APP_IPHONE_40",
  "APP_IPHONE_35",
  "APP_IPAD_PRO_3GEN_129",
  "APP_IPAD_PRO_3GEN_11",
  "APP_IPAD_PRO_129",
  "APP_IPAD_105",
  "APP_IPAD_97",
  "APP_DESKTOP",
  "APP_WATCH_ULTRA",
  "APP_WATCH_SERIES_7",
  "APP_WATCH_SERIES_4",
  "APP_WATCH_SERIES_3",
  "APP_APPLE_TV",
  "APP_APPLE_VISION_PRO",
  "IMESSAGE_APP_IPHONE_67",
  "IMESSAGE_APP_IPHONE_65",
  "IMESSAGE_APP_IPHONE_61",
  "IMESSAGE_APP_IPHONE_58",
  "IMESSAGE_APP_IPHONE_55",
  "IMESSAGE_APP_IPHONE_47",
  "IMESSAGE_APP_IPHONE_40",
  "IMESSAGE_APP_IPAD_PRO_3GEN_129",
  "IMESSAGE_APP_IPAD_PRO_3GEN_11",
  "IMESSAGE_APP_IPAD_PRO_129",
  "IMESSAGE_APP_IPAD_105",
  "IMESSAGE_APP_IPAD_97",
] as const;

const PREVIEW_TYPES = [
  "IPHONE_67",
  "IPHONE_65",
  "IPHONE_61",
  "IPHONE_58",
  "IPHONE_55",
  "IPHONE_47",
  "IPAD_PRO_3GEN_129",
  "IPAD_PRO_3GEN_11",
  "IPAD_PRO_129",
  "IPAD_105",
  "IPAD_97",
  "DESKTOP",
  "APPLE_TV",
  "APPLE_VISION_PRO",
] as const;

interface UploadOperation {
  method?: string;
  url?: string;
  length?: number;
  offset?: number;
  requestHeaders?: Array<{ name: string; value: string }>;
}

async function uploadAssetParts(
  filePath: string,
  ops: UploadOperation[]
): Promise<void> {
  const buf = readFileSync(filePath);
  for (const op of ops) {
    if (!op.url || !op.method) continue;
    const part = buf.subarray(op.offset ?? 0, (op.offset ?? 0) + (op.length ?? buf.length));
    const headers: Record<string, string> = {};
    for (const h of op.requestHeaders ?? []) headers[h.name] = h.value;
    await axios.request({
      method: op.method,
      url: op.url,
      data: part,
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }
}

function md5Hex(filePath: string): string {
  return createHash("md5").update(readFileSync(filePath)).digest("hex");
}

export function registerMediaTools(server: McpServer): void {
  server.tool(
    "list_screenshot_sets",
    "List screenshot sets for a version localization. Each set is one device size (e.g. APP_IPHONE_67).",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
      filter_screenshot_display_type: z
        .array(z.enum(SCREENSHOT_DISPLAY_TYPES))
        .optional()
        .describe("Filter by screenshot display type"),
    },
    async ({ localization_id, filter_screenshot_display_type }) => {
      try {
        const params = buildQueryParams({
          "filter[screenshotDisplayType]": filter_screenshot_display_type,
        });
        const { data } = await getApiClient().get(
          `/v1/appStoreVersionLocalizations/${localization_id}/appScreenshotSets`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_screenshot_set",
    "Create a screenshot set for one device size on a version localization.",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
      screenshot_display_type: z
        .enum(SCREENSHOT_DISPLAY_TYPES)
        .describe("Device size, e.g. APP_IPHONE_67"),
    },
    async ({ localization_id, screenshot_display_type }) => {
      try {
        const body = {
          data: {
            type: "appScreenshotSets",
            attributes: { screenshotDisplayType: screenshot_display_type },
            relationships: {
              appStoreVersionLocalization: {
                data: { type: "appStoreVersionLocalizations", id: localization_id },
              },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appScreenshotSets", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "upload_screenshot",
    "Upload a screenshot image file to a screenshot set. Performs reservation, chunked upload, and commit. File path must be absolute.",
    {
      screenshot_set_id: z.string().describe("appScreenshotSet resource ID"),
      file_path: z.string().describe("Absolute path to PNG/JPEG screenshot"),
      file_name: z
        .string()
        .optional()
        .describe("Override the file name registered with Apple. Defaults to basename."),
    },
    async ({ screenshot_set_id, file_path, file_name }) => {
      try {
        const buf = readFileSync(file_path);
        const finalName = file_name ?? file_path.split("/").pop() ?? "screenshot.png";

        // Step 1 — reserve
        const reserve = await getApiClient().post("/v1/appScreenshots", {
          data: {
            type: "appScreenshots",
            attributes: {
              fileName: finalName,
              fileSize: buf.byteLength,
            },
            relationships: {
              appScreenshotSet: {
                data: { type: "appScreenshotSets", id: screenshot_set_id },
              },
            },
          },
        });
        const screenshotId: string = reserve.data.data.id;
        const ops: UploadOperation[] =
          reserve.data.data.attributes.uploadOperations ?? [];

        // Step 2 — upload parts
        await uploadAssetParts(file_path, ops);

        // Step 3 — commit
        const checksum = md5Hex(file_path);
        const commit = await getApiClient().patch(`/v1/appScreenshots/${screenshotId}`, {
          data: {
            type: "appScreenshots",
            id: screenshotId,
            attributes: {
              uploaded: true,
              sourceFileChecksum: checksum,
            },
          },
        });
        return { content: [jsonText(commit.data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_screenshots",
    "List uploaded screenshots in a set with their order and asset state.",
    {
      screenshot_set_id: z.string().describe("appScreenshotSet resource ID"),
    },
    async ({ screenshot_set_id }) => {
      try {
        const { data } = await getApiClient().get(
          `/v1/appScreenshotSets/${screenshot_set_id}/appScreenshots`
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "reorder_screenshots",
    "Set the display order of screenshots in a set. Pass IDs in desired order.",
    {
      screenshot_set_id: z.string().describe("appScreenshotSet resource ID"),
      screenshot_ids: z.array(z.string()).min(1).describe("Screenshot IDs in display order"),
    },
    async ({ screenshot_set_id, screenshot_ids }) => {
      try {
        const body = {
          data: screenshot_ids.map((id) => ({ type: "appScreenshots", id })),
        };
        const { data } = await getApiClient().patch(
          `/v1/appScreenshotSets/${screenshot_set_id}/relationships/appScreenshots`,
          body
        );
        return { content: [jsonText(data ?? { ok: true })] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "delete_screenshot",
    "Delete a single screenshot.",
    {
      screenshot_id: z.string().describe("appScreenshot resource ID"),
    },
    async ({ screenshot_id }) => {
      try {
        await getApiClient().delete(`/v1/appScreenshots/${screenshot_id}`);
        return { content: [{ type: "text", text: `Screenshot ${screenshot_id} deleted.` }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "list_preview_sets",
    "List app preview (video) sets for a version localization. One set per device size.",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
      filter_preview_type: z
        .array(z.enum(PREVIEW_TYPES))
        .optional()
        .describe("Filter by preview type"),
    },
    async ({ localization_id, filter_preview_type }) => {
      try {
        const params = buildQueryParams({ "filter[previewType]": filter_preview_type });
        const { data } = await getApiClient().get(
          `/v1/appStoreVersionLocalizations/${localization_id}/appPreviewSets`,
          { params }
        );
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "create_preview_set",
    "Create an app preview set for a device size on a version localization.",
    {
      localization_id: z.string().describe("appStoreVersionLocalization resource ID"),
      preview_type: z.enum(PREVIEW_TYPES).describe("Device size, e.g. IPHONE_67"),
    },
    async ({ localization_id, preview_type }) => {
      try {
        const body = {
          data: {
            type: "appPreviewSets",
            attributes: { previewType: preview_type },
            relationships: {
              appStoreVersionLocalization: {
                data: { type: "appStoreVersionLocalizations", id: localization_id },
              },
            },
          },
        };
        const { data } = await getApiClient().post("/v1/appPreviewSets", body);
        return { content: [jsonText(data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );

  server.tool(
    "upload_app_preview",
    "Upload an app preview video to a preview set (reserve + chunked upload + commit). File path must be absolute.",
    {
      preview_set_id: z.string().describe("appPreviewSet resource ID"),
      file_path: z.string().describe("Absolute path to MOV/M4V/MP4"),
      file_name: z.string().optional().describe("Override file name. Default: basename"),
      preview_frame_time_code: z
        .string()
        .optional()
        .describe("Time code for poster frame, e.g. '00:00:02:00'"),
    },
    async ({ preview_set_id, file_path, file_name, preview_frame_time_code }) => {
      try {
        const buf = readFileSync(file_path);
        const finalName = file_name ?? file_path.split("/").pop() ?? "preview.mov";

        const reserve = await getApiClient().post("/v1/appPreviews", {
          data: {
            type: "appPreviews",
            attributes: {
              fileName: finalName,
              fileSize: buf.byteLength,
              previewFrameTimeCode: preview_frame_time_code,
            },
            relationships: {
              appPreviewSet: { data: { type: "appPreviewSets", id: preview_set_id } },
            },
          },
        });
        const previewId: string = reserve.data.data.id;
        const ops: UploadOperation[] = reserve.data.data.attributes.uploadOperations ?? [];

        await uploadAssetParts(file_path, ops);

        const checksum = md5Hex(file_path);
        const commit = await getApiClient().patch(`/v1/appPreviews/${previewId}`, {
          data: {
            type: "appPreviews",
            id: previewId,
            attributes: {
              uploaded: true,
              sourceFileChecksum: checksum,
              previewFrameTimeCode: preview_frame_time_code,
            },
          },
        });
        return { content: [jsonText(commit.data)] };
      } catch (error) {
        return { content: [{ type: "text", text: formatError(error) }], isError: true };
      }
    }
  );
}
