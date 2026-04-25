import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerAppTools } from "../../src/tools/apps.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerAppTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("app tools", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.delete.mockReset();
  });

  it("list_apps requests /v1/apps with filters", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { data: [{ id: "1", attributes: { name: "TestApp" } }] },
    });
    const tools = makeServer();
    const result = await tools.list_apps.handler(
      { limit: 5, filter_bundle_id: "com.foo.bar" },
      {}
    );
    expect(apiMock.get).toHaveBeenCalledWith("/v1/apps", {
      params: { limit: 5, "filter[bundleId]": "com.foo.bar" },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("TestApp");
  });

  it("list_apps surfaces API errors with isError=true", async () => {
    apiMock.get.mockRejectedValueOnce(new Error("App Store Connect API 401: NOT_AUTHORIZED"));
    const tools = makeServer();
    const result = await tools.list_apps.handler({ limit: 5 }, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NOT_AUTHORIZED");
  });

  it("get_app passes include params", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: { id: "abc" } } });
    const tools = makeServer();
    await tools.get_app.handler(
      { app_id: "abc", include: ["builds", "appStoreVersions"] },
      {}
    );
    expect(apiMock.get).toHaveBeenCalledWith("/v1/apps/abc", {
      params: { include: "builds,appStoreVersions" },
    });
  });
});
