import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAppTools } from "./tools/apps.js";
import { registerBuildTools } from "./tools/builds.js";
import { registerTestFlightTools } from "./tools/testflight.js";
import { registerReviewTools } from "./tools/reviews.js";
import { registerSalesTools } from "./tools/sales.js";
import { registerUserTools } from "./tools/users.js";

export const SERVER_NAME = "appstore-connect-mcp";
export const SERVER_VERSION = "1.0.0";

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerAppTools(server);
  registerBuildTools(server);
  registerTestFlightTools(server);
  registerReviewTools(server);
  registerSalesTools(server);
  registerUserTools(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout reserved for MCP protocol
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}
