/**
 * Error handler utilities for MCP tools
 */

/**
 * Wraps an MCP tool handler with error handling.
 * Returns a properly formatted error response instead of throwing.
 */
export function wrapTool<T extends Record<string, unknown>>(
	handler: (args: T) => Promise<unknown>,
): (args: T) => Promise<unknown> {
	return async (args: T) => {
		try {
			return await handler(args);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("[Tool Error]", message); // Log to stderr for debugging

			// Return error response instead of throwing
			return {
				content: [
					{
						type: "text",
						text: `执行失败: ${message}`,
					},
				],
				isError: true,
			};
		}
	};
}
