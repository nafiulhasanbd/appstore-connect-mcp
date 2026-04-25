import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerLocalizationTools } from "../../src/tools/localizations.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerLocalizationTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("localization tools", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.get.mockReset();
  });

  it("create_app_store_version_localization posts metadata payload", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "loc1" } } });
    const tools = makeServer();
    await tools.create_app_store_version_localization.handler(
      {
        version_id: "ver1",
        locale: "en-US",
        description: "Best app ever.",
        keywords: "fitness,health,workout",
        promotional_text: "New workouts every week.",
        whats_new: "v2 — major redesign",
      },
      {}
    );
    const call = apiMock.post.mock.calls[0];
    expect(call[0]).toBe("/v1/appStoreVersionLocalizations");
    expect(call[1].data.attributes.locale).toBe("en-US");
    expect(call[1].data.attributes.whatsNew).toBe("v2 — major redesign");
    expect(call[1].data.relationships.appStoreVersion.data.id).toBe("ver1");
  });

  it("update_app_store_version_localization PATCHes the localization", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "loc1" } } });
    const tools = makeServer();
    await tools.update_app_store_version_localization.handler(
      { localization_id: "loc1", whats_new: "Bug fixes" },
      {}
    );
    expect(apiMock.patch).toHaveBeenCalledWith(
      "/v1/appStoreVersionLocalizations/loc1",
      expect.objectContaining({
        data: expect.objectContaining({
          id: "loc1",
          attributes: expect.objectContaining({ whatsNew: "Bug fixes" }),
        }),
      })
    );
  });
});
