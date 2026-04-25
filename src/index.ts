#!/usr/bin/env node
import { startServer } from "./server.js";

startServer().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`Fatal error: ${msg}`);
  process.exit(1);
});
