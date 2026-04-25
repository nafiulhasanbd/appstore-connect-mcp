import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerAgeRatingTools } from "../../src/tools/ageRatings.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerAgeRatingTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("age rating tools", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.patch.mockReset();
  });

  it("get_age_rating_declaration GETs nested resource", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: { id: "decl1" } } });
    const tools = makeServer();
    await tools.get_age_rating_declaration.handler({ app_info_id: "info1" }, {});
    expect(apiMock.get).toHaveBeenCalledWith("/v1/appInfos/info1/ageRatingDeclaration");
  });

  it("update_age_rating_declaration strips undefined and PATCHes only set fields", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "decl1" } } });
    const tools = makeServer();
    await tools.update_age_rating_declaration.handler(
      {
        declaration_id: "decl1",
        violence_cartoon_or_fantasy: "INFREQUENT_OR_MILD",
        gambling: false,
      },
      {}
    );
    const call = apiMock.patch.mock.calls[0];
    expect(call[0]).toBe("/v1/ageRatingDeclarations/decl1");
    expect(call[1].data.attributes).toEqual({
      violenceCartoonOrFantasy: "INFREQUENT_OR_MILD",
      gambling: false,
    });
    // Verify undefined keys not sent
    expect(call[1].data.attributes).not.toHaveProperty("alcoholTobaccoOrDrugUseOrReferences");
  });
});
