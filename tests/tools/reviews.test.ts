import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerReviewTools } from "../../src/tools/reviews.js";

interface RegisteredTool {
  callback: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerReviewTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("review tools", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.delete.mockReset();
  });

  it("respond_to_customer_review posts JSON:API body", async () => {
    apiMock.post.mockResolvedValueOnce({
      data: { data: { id: "resp1" } },
    });
    const tools = makeServer();
    const result = await tools.respond_to_customer_review.handler(
      { review_id: "rev1", response_body: "Thanks for the feedback!" },
      {}
    );
    expect(apiMock.post).toHaveBeenCalledWith("/v1/customerReviewResponses", {
      data: {
        type: "customerReviewResponses",
        attributes: { responseBody: "Thanks for the feedback!" },
        relationships: {
          review: { data: { type: "customerReviews", id: "rev1" } },
        },
      },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("resp1");
  });

  it("list_customer_reviews encodes territory filter as comma list", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { data: [] } });
    const tools = makeServer();
    await tools.list_customer_reviews.handler(
      { app_id: "app1", filter_territory: ["USA", "GBR"] },
      {}
    );
    const call = apiMock.get.mock.calls[0];
    expect(call[0]).toBe("/v1/apps/app1/customerReviews");
    expect(call[1].params["filter[territory]"]).toBe("USA,GBR");
  });
});
