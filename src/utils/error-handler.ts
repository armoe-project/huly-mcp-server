/**
 * Error handler utilities for MCP tools
 *
 * Note: MCP SDK has built-in error handling via createToolError.
 * Tool handlers can throw exceptions normally - they will be caught
 * and converted to proper error responses with isError: true.
 *
 * The global error handlers in index.ts are configured to log errors
 * without crashing the server (no process.exit).
 */

// Empty export - this file exists for documentation purposes
export {};
