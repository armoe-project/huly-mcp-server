import type { PlatformClient } from "@hcengineering/api-client";
import { generateId, type Ref } from "@hcengineering/core";
import tracker, {
	type Milestone,
	MilestoneStatus,
} from "@hcengineering/tracker";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import {
	milestoneStatusToString,
	stringToMilestoneStatus,
} from "../utils/converters.js";
import { wrapTool } from "../utils/error-handler.js";

// List Milestones
export function registerListMilestones(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_milestones",
		{
			title: "List Milestones",
			description: "List milestones for a project",
			inputSchema: {
				project: z.string().describe("Project identifier"),
			},
			outputSchema: {
				milestones: z.array(
					z.object({
						id: z.string(),
						label: z.string(),
						status: z.string(),
						targetDate: z.string().nullable(),
					}),
				),
			},
		},
		wrapTool(async ({ project }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const milestones = await client.findAll(tracker.class.Milestone, {
				space: projectData._id,
			});

			return {
				content: [
					{
						type: "text",
						text: `Found ${milestones.length} milestone(s):\n${milestones.map((m) => `- ${m.label}: ${milestoneStatusToString(m.status)}`).join("\n")}`,
					},
				],
				structuredContent: {
					milestones: milestones.map((m) => ({
						id: m._id,
						label: m.label,
						status: milestoneStatusToString(m.status),
						targetDate: m.targetDate
							? new Date(m.targetDate).toISOString()
							: null,
					})),
				},
			};
		}),
	);
}

// Create Milestone
export function registerCreateMilestone(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"create_milestone",
		{
			title: "Create Milestone",
			description: "Create a new milestone",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				label: z.string().describe("Milestone name"),
				targetDate: z
					.string()
					.optional()
					.describe("Target date (ISO 8601 format)"),
				status: z
					.string()
					.optional()
					.describe("Status (Planned/InProgress/Completed/Canceled)"),
			},
			outputSchema: {
				milestone: z.object({
					id: z.string(),
					label: z.string(),
				}),
			},
		},
		wrapTool(async ({ project, label, targetDate, status }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const milestoneId: Ref<Milestone> = generateId();

			await client.createDoc(
				tracker.class.Milestone,
				projectData._id,
				{
					label,
					status: status
						? stringToMilestoneStatus(status)
						: MilestoneStatus.Planned,
					targetDate: targetDate
						? new Date(targetDate).getTime()
						: Date.now() + 1000 * 60 * 60 * 24 * 14,
					comments: 0,
				},
				milestoneId,
			);

			return {
				content: [
					{
						type: "text",
						text: `Created milestone: ${label}`,
					},
				],
				structuredContent: {
					milestone: {
						id: milestoneId,
						label,
					},
				},
			};
		}),
	);
}

// Delete Milestone
export function registerDeleteMilestone(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"delete_milestone",
		{
			title: "Delete Milestone",
			description: "Delete a milestone",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				label: z.string().describe("Milestone name"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project, label }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const milestone = await client.findOne(tracker.class.Milestone, {
				space: projectData._id,
				label,
			});

			if (!milestone) {
				throw new Error(`Milestone "${label}" not found`);
			}

			await client.removeDoc(
				tracker.class.Milestone,
				projectData._id,
				milestone._id,
			);

			return {
				content: [
					{
						type: "text",
						text: `Deleted milestone: ${label}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}
