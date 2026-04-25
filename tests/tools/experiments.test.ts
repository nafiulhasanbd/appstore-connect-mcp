import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiMock } from "../setup.js";
import { registerExperimentTools } from "../../src/tools/experiments.js";

interface RegisteredTool {
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

function makeServer() {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerExperimentTools(server);
  return (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
}

describe("experiment (PPO) tools", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
    apiMock.patch.mockReset();
    apiMock.delete.mockReset();
    apiMock.get.mockReset();
  });

  it("create_app_store_version_experiment posts traffic + name", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "exp1" } } });
    const tools = makeServer();
    await tools.create_app_store_version_experiment.handler(
      { version_id: "ver1", name: "Icon test", traffic_proportion: 50 },
      {}
    );
    const call = apiMock.post.mock.calls[0];
    expect(call[0]).toBe("/v2/appStoreVersionExperiments");
    expect(call[1].data.attributes).toEqual({ name: "Icon test", trafficProportion: 50 });
    expect(call[1].data.relationships.appStoreVersion.data.id).toBe("ver1");
  });

  it("start_app_store_version_experiment PATCHes started=true", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "exp1" } } });
    const tools = makeServer();
    await tools.start_app_store_version_experiment.handler({ experiment_id: "exp1" }, {});
    expect(apiMock.patch).toHaveBeenCalledWith("/v2/appStoreVersionExperiments/exp1", {
      data: {
        type: "appStoreVersionExperiments",
        id: "exp1",
        attributes: { started: true },
      },
    });
  });

  it("stop_app_store_version_experiment PATCHes state=STOPPED", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "exp1" } } });
    const tools = makeServer();
    await tools.stop_app_store_version_experiment.handler({ experiment_id: "exp1" }, {});
    expect(apiMock.patch).toHaveBeenCalledWith("/v2/appStoreVersionExperiments/exp1", {
      data: {
        type: "appStoreVersionExperiments",
        id: "exp1",
        attributes: { state: "STOPPED" },
      },
    });
  });
});
