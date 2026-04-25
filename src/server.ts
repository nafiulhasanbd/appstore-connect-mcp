import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAppTools } from "./tools/apps.js";
import { registerBuildTools } from "./tools/builds.js";
import { registerTestFlightTools } from "./tools/testflight.js";
import { registerReviewTools } from "./tools/reviews.js";
import { registerSalesTools } from "./tools/sales.js";
import { registerUserTools } from "./tools/users.js";
import { registerMetadataTools } from "./tools/metadata.js";
import { registerLocalizationTools } from "./tools/localizations.js";
import { registerMediaTools } from "./tools/media.js";
import { registerPricingTools } from "./tools/pricing.js";
import { registerIapTools } from "./tools/iap.js";
import { registerSubscriptionTools } from "./tools/subscriptions.js";
import { registerSubmissionTools } from "./tools/submission.js";
import { registerCustomProductPageTools } from "./tools/customProductPages.js";
import { registerExperimentTools } from "./tools/experiments.js";
import { registerAppEventTools } from "./tools/appEvents.js";
import { registerAgeRatingTools } from "./tools/ageRatings.js";

export const SERVER_NAME = "appstore-connect-mcp";
export const SERVER_VERSION = "1.4.0";

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
  registerMetadataTools(server);
  registerLocalizationTools(server);
  registerMediaTools(server);
  registerPricingTools(server);
  registerIapTools(server);
  registerSubscriptionTools(server);
  registerSubmissionTools(server);
  registerCustomProductPageTools(server);
  registerExperimentTools(server);
  registerAppEventTools(server);
  registerAgeRatingTools(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}
