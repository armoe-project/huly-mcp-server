import type { PlatformClient } from "@hcengineering/api-client";
import core, { generateId, type Ref } from "@hcengineering/core";
import tags, { type TagElement } from "@hcengineering/tags";
import tracker from "@hcengineering/tracker";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { wrapTool } from "../utils/error-handler.js";

// Add Label
export function registerAddLabel(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"add_label",
		{
			title: "Add Label",
			description: "Add label to issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				label: z.string().describe("Label name"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project, identifier, label }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const issue = await client.findOne(tracker.class.Issue, {
				space: projectData._id,
				identifier,
			});

			if (!issue) {
				throw new Error(`Issue "${identifier}" not found`);
			}

			// Check if label already exists
			let tagElement = await client.findOne(tags.class.TagElement, {
				targetClass: tracker.class.Issue,
				title: label,
			});

			// Create label if it doesn't exist
			if (!tagElement) {
				const labelId: Ref<TagElement> = generateId();
				await client.createDoc(
					tags.class.TagElement,
					core.space.Workspace,
					{
						title: label,
						description: "",
						targetClass: tracker.class.Issue,
						color: Math.floor(Math.random() * 20),
						category: tracker.category.Other,
					},
					labelId,
				);
				tagElement = (await client.findOne(tags.class.TagElement, {
					_id: labelId,
				})) as TagElement;
			}

			if (!tagElement) {
				throw new Error("Failed to create or find tag element");
			}

			// Check if already attached
			const existing = await client.findOne(tags.class.TagReference, {
				attachedTo: issue._id,
				attachedToClass: tracker.class.Issue,
				tag: tagElement._id,
			});

			if (existing) {
				return {
					content: [
						{ type: "text", text: `Label "${label}" already exists on issue` },
					],
					structuredContent: { success: true },
				};
			}

			// Attach label to issue
			await client.addCollection(
				tags.class.TagReference,
				projectData._id,
				issue._id,
				tracker.class.Issue,
				"labels",
				{
					title: label,
					color: tagElement.color,
					tag: tagElement._id,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Added label "${label}" to ${identifier}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}

// Remove Label
export function registerRemoveLabel(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"remove_label",
		{
			title: "Remove Label",
			description: "Remove label from issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				label: z.string().describe("Label name"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project, identifier, label }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const issue = await client.findOne(tracker.class.Issue, {
				space: projectData._id,
				identifier,
			});

			if (!issue) {
				throw new Error(`Issue "${identifier}" not found`);
			}

			const tagElement = await client.findOne(tags.class.TagElement, {
				targetClass: tracker.class.Issue,
				title: label,
			});

			if (!tagElement) {
				throw new Error(`Label "${label}" not found`);
			}

			const tagRef = await client.findOne(tags.class.TagReference, {
				attachedTo: issue._id,
				attachedToClass: tracker.class.Issue,
				tag: tagElement._id,
			});

			if (tagRef) {
				await client.removeDoc(
					tags.class.TagReference,
					projectData._id,
					tagRef._id,
				);
			}

			return {
				content: [
					{
						type: "text",
						text: `Removed label "${label}" from ${identifier}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}
