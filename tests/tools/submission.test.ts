import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerSubmissionTools } from "../../src/tools/submission.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerSubmissionTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("submission tools", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.delete.mockReset();
  });

  it("create_app_store_version posts version draft", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "ver1" } } });
    const tools = makeServer();
    const result = await tools.create_app_store_version.handler(
      {
        app_id: "app1",
        version_string: "2.0.0",
        platform: "IOS",
        copyright: "2026 Acme",
      },
      {}
    );
    expect(apiMock.post).toHaveBeenCalledWith("/v1/appStoreVersions", {
      data: {
        type: "appStoreVersions",
        attributes: {
          versionString: "2.0.0",
          platform: "IOS",
          copyright: "2026 Acme",
          releaseType: undefined,
          earliestReleaseDate: undefined,
        },
        relationships: { app: { data: { type: "apps", id: "app1" } } },
      },
    });
    expect(result.content[0].text).toContain("ver1");
  });

  it("attach_build_to_version PATCHes the relationship endpoint", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: undefined });
    const tools = makeServer();
    const result = await tools.attach_build_to_version.handler(
      { version_id: "ver1", build_id: "bld42" },
      {}
    );
    expect(apiMock.patch).toHaveBeenCalledWith(
      "/v1/appStoreVersions/ver1/relationships/build",
      { data: { type: "builds", id: "bld42" } }
    );
    expect(result.isError).toBeFalsy();
  });

  it("submit_review_submission marks submitted=true", async () => {
    apiMock.patch.mockResolvedValueOnce({
      data: { data: { id: "sub1", attributes: { submitted: true } } },
    });
    const tools = makeServer();
    await tools.submit_review_submission.handler({ review_submission_id: "sub1" }, {});
    expect(apiMock.patch).toHaveBeenCalledWith("/v1/reviewSubmissions/sub1", {
      data: {
        type: "reviewSubmissions",
        id: "sub1",
        attributes: { submitted: true },
      },
    });
  });
});
