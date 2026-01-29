import type { PlatformClient } from "@hcengineering/api-client";
import tracker from "@hcengineering/tracker";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { wrapTool } from "../utils/error-handler.js";

// List Projects
export function registerListProjects(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_projects",
		{
			title: "List Projects",
			description: "List all projects",
			inputSchema: {},
			outputSchema: {
				projects: z.array(
					z.object({
						id: z.string(),
						identifier: z.string(),
						name: z.string(),
						description: z.string().nullable(),
					}),
				),
			},
		},
		wrapTool(async () => {
			const client = await getClient();

			const projects = await client.findAll(tracker.class.Project, {});

			return {
				content: [
					{
						type: "text",
						text: `Found ${projects.length} project(s):\n${projects.map((p) => `- ${p.identifier}: ${p.name}`).join("\n")}`,
					},
				],
				structuredContent: {
					projects: projects.map((p) => ({
						id: p._id,
						identifier: p.identifier,
						name: p.name,
						description: p.description ?? null,
					})),
				},
			};
		}),
	);
}

// Get Project
export function registerGetProject(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"get_project",
		{
			title: "Get Project",
			description: "Get project details",
			inputSchema: {
				identifier: z.string().describe("Project identifier (e.g. HULY)"),
			},
			outputSchema: {
				project: z.object({
					id: z.string(),
					identifier: z.string(),
					name: z.string(),
					description: z.string().nullable(),
				}),
			},
		},
		wrapTool(async ({ identifier }) => {
			const client = await getClient();

			const project = await client.findOne(tracker.class.Project, {
				identifier,
			});

			if (!project) {
				throw new Error(`Project "${identifier}" not found`);
			}

			return {
				content: [
					{
						type: "text",
						text: `Project: ${project.identifier}\nName: ${project.name}\nDescription: ${project.description ?? "none"}`,
					},
				],
				structuredContent: {
					project: {
						id: project._id,
						identifier: project.identifier,
						name: project.name,
						description: project.description ?? null,
					},
				},
			};
		}),
	);
}
