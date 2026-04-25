import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerCustomProductPageTools } from "../../src/tools/customProductPages.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerCustomProductPageTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("custom product page tools", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.delete.mockReset();
    apiMock.get.mockReset();
  });

  it("create_custom_product_page posts CPP body with app rel", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "cpp1" } } });
    const tools = makeServer();
    await tools.create_custom_product_page.handler(
      { app_id: "app1", name: "Holiday Campaign" },
      {}
    );
    expect(apiMock.post).toHaveBeenCalledWith("/v1/appCustomProductPages", {
      data: {
        type: "appCustomProductPages",
        attributes: { name: "Holiday Campaign" },
        relationships: { app: { data: { type: "apps", id: "app1" } } },
      },
    });
  });

  it("create_custom_product_page_localization posts promo text", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "loc1" } } });
    const tools = makeServer();
    await tools.create_custom_product_page_localization.handler(
      {
        cpp_version_id: "ver1",
        locale: "en-US",
        promotional_text: "Limited-time offer",
      },
      {}
    );
    const call = apiMock.post.mock.calls[0];
    expect(call[0]).toBe("/v1/appCustomProductPageLocalizations");
    expect(call[1].data.attributes.promotionalText).toBe("Limited-time offer");
  });
});
