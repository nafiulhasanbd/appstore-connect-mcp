export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  if (typeof error === "string") {
    return `Error: ${error}`;
  }
  try {
    return `Error: ${JSON.stringify(error)}`;
  } catch {
    return `Error: ${String(error)}`;
  }
}
