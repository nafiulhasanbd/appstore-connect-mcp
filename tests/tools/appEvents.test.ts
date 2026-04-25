import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerAppEventTools } from "../../src/tools/appEvents.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerAppEventTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("app event tools", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.delete.mockReset();
    apiMock.get.mockReset();
  });

  it("create_app_event posts event w/ territories rel", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "ev1" } } });
    const tools = makeServer();
    await tools.create_app_event.handler(
      {
        app_id: "app1",
        reference_name: "Holiday Sale",
        badge: "SPECIAL_EVENT",
        purpose: "ATTRACT_NEW_USERS",
        priority: "HIGH",
        territory_ids: ["USA", "GBR"],
      },
      {}
    );
    const call = apiMock.post.mock.calls[0];
    expect(call[0]).toBe("/v1/appEvents");
    expect(call[1].data.attributes.referenceName).toBe("Holiday Sale");
    expect(call[1].data.attributes.badge).toBe("SPECIAL_EVENT");
    expect(call[1].data.relationships.territories.data).toEqual([
      { type: "territories", id: "USA" },
      { type: "territories", id: "GBR" },
    ]);
  });

  it("submit_app_event_for_review PATCHes eventState=READY_FOR_REVIEW", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "ev1" } } });
    const tools = makeServer();
    await tools.submit_app_event_for_review.handler({ event_id: "ev1" }, {});
    expect(apiMock.patch).toHaveBeenCalledWith("/v1/appEvents/ev1", {
      data: {
        type: "appEvents",
        id: "ev1",
        attributes: { eventState: "READY_FOR_REVIEW" },
      },
    });
  });

  it("create_app_event_localization posts name/short/long descriptions", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "loc1" } } });
    const tools = makeServer();
    await tools.create_app_event_localization.handler(
      {
        event_id: "ev1",
        locale: "en-US",
        name: "Holiday Sale",
        short_description: "Big savings on coins",
        long_description: "Up to 50 percent off all coin packs this weekend only.",
      },
      {}
    );
    const call = apiMock.post.mock.calls[0];
    expect(call[0]).toBe("/v1/appEventLocalizations");
    expect(call[1].data.attributes.shortDescription).toBe("Big savings on coins");
    expect(call[1].data.relationships.appEvent.data.id).toBe("ev1");
  });
});
