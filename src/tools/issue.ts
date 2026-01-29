import type { PlatformClient } from "@hcengineering/api-client";
import type { Person } from "@hcengineering/contact";
import core, {
	type Class,
	generateId,
	type Ref,
	SortingOrder,
} from "@hcengineering/core";
import { makeRank } from "@hcengineering/rank";
import tracker, {
	type Issue,
	IssuePriority,
	type Milestone,
} from "@hcengineering/tracker";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { priorityToString, stringToPriority } from "../utils/converters.js";

// Type definitions to avoid `any`
interface IssueQuery {
	space: string;
	status?: string;
}

interface UpdateResult {
	object: {
		sequence: number;
	};
}

interface IssueUpdates {
	title?: string;
	status?: Ref<string>;
	priority?: number;
	assignee?: Ref<Person> | null;
}


// List Issues
export function registerListIssues(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_issues",
		{
			title: "List Issues",
			description: "List issues in a project",
			inputSchema: {
				project: z.string().describe("Project identifier (e.g. HULY)"),
				limit: z.number().optional().describe("Result limit, default 20"),
				status: z.string().optional().describe("Status filter"),
			},
			outputSchema: {
				issues: z.array(
					z.object({
						id: z.string(),
						identifier: z.string(),
						title: z.string(),
						status: z.string(),
						priority: z.string(),
						assignee: z.string().nullable(),
					}),
				),
			},
		},
		async ({ project, limit = 20, status }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const query: IssueQuery = { space: projectData._id };
			if (status) {
				query.status = status;
			}

			const issues = await client.findAll(tracker.class.Issue, query, {
				limit,
				sort: { modifiedOn: SortingOrder.Descending },
			});

			return {
				content: [
					{
						type: "text",
						text: `Found ${issues.length} issue(s):\n${issues.map((i) => `- ${i.identifier}: ${i.title}`).join("\n")}`,
					},
				],
				structuredContent: {
					issues: issues.map((i) => ({
						id: i._id,
						identifier: i.identifier,
						title: i.title,
						status: i.status,
						priority: priorityToString(i.priority),
						assignee: i.assignee ?? null,
					})),
				},
			};
		},
	);
}

// Get Issue
export function registerGetIssue(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"get_issue",
		{
			title: "Get Issue",
			description: "Get issue details",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier (e.g. HULY-123)"),
			},
			outputSchema: {
				issue: z.object({
					id: z.string(),
					identifier: z.string(),
					title: z.string(),
					description: z.string().nullable(),
					status: z.string(),
					priority: z.string(),
					assignee: z.string().nullable(),
					milestone: z.string().nullable(),
					dueDate: z.string().nullable(),
				}),
			},
		},
		async ({ project, identifier }) => {
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

			let description = null;
			if (issue.description) {
				const markup = await client.fetchMarkup(
					issue._class,
					issue._id,
					"description",
					issue.description,
					"markdown",
				);
				description = markup;
			}

			const priorityToString = (p: number): string => {
				switch (p) {
					case IssuePriority.Urgent:
						return "urgent";
					case IssuePriority.High:
						return "high";
					case IssuePriority.Medium:
						return "medium";
					case IssuePriority.Low:
						return "low";
					case IssuePriority.NoPriority:
						return "none";
					default:
						return "medium";
				}
			};

			const priorityStr = priorityToString(issue.priority);

			return {
				content: [
					{
						type: "text",
						text: `${issue.identifier}: ${issue.title}\nStatus: ${issue.status}\nPriority: ${priorityStr}\nAssignee: ${issue.assignee ?? "unassigned"}`,
					},
				],
				structuredContent: {
					issue: {
						id: issue._id,
						identifier: issue.identifier,
						title: issue.title,
						description,
						status: issue.status,
						priority: priorityStr,
						assignee: issue.assignee ?? null,
						milestone: issue.milestone ?? null,
						dueDate: issue.dueDate
							? new Date(issue.dueDate).toISOString()
							: null,
					},
				},
			};
		},
	);
}

// Create Issue
export function registerCreateIssue(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"create_issue",
		{
			title: "Create Issue",
			description: "Create a new issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				title: z.string().describe("Issue title"),
				description: z
					.string()
					.optional()
					.describe("Issue description (Markdown supported)"),
				priority: z
					.string()
					.optional()
					.describe("Priority (urgent/high/medium/low/none)"),
				assignee: z.string().optional().describe("Assignee ID"),
			},
			outputSchema: {
				issue: z.object({
					id: z.string(),
					identifier: z.string(),
					title: z.string(),
				}),
			},
		},
		async ({ project, title, description, priority, assignee }) => {
			const client = await getClient();

			const projectData = await client.findOne(tracker.class.Project, {
				identifier: project,
			});

			if (!projectData) {
				throw new Error(`Project "${project}" not found`);
			}

			const issueId: Ref<Issue> = generateId();

			const incResult = await client.updateDoc(
				tracker.class.Project,
				core.space.Space,
				projectData._id,
				{ $inc: { sequence: 1 } },
				true,
			);

			const sequence = (incResult as UpdateResult).object.sequence;

			const lastOne = await client.findOne<Issue>(
				tracker.class.Issue,
				{ space: projectData._id },
				{ sort: { rank: SortingOrder.Descending } },
			);

			let descriptionRef = null;
			if (description) {
				descriptionRef = await client.uploadMarkup(
					tracker.class.Issue,
					issueId,
					"description",
					description,
					"markdown",
				);
			}

			await client.addCollection(
				tracker.class.Issue,
				projectData._id,
				projectData._id,
				projectData._class,
				"issues",
				{
					title,
					description: descriptionRef,
					status: projectData.defaultIssueStatus,
					number: sequence,
					kind: tracker.taskTypes.Issue,
					identifier: `${projectData.identifier}-${sequence}`,
					priority: priority
						? stringToPriority(priority)
						: IssuePriority.Medium,
					assignee: (assignee ?? null) as Ref<Person> | null,
					component: null,
					estimation: 0,
					remainingTime: 0,
					reportedTime: 0,
					reports: 0,
					subIssues: 0,
					parents: [],
					childInfo: [],
					dueDate: null,
					milestone: null,
					rank: makeRank(lastOne?.rank, undefined),
				},
				issueId,
			);

			return {
				content: [
					{
						type: "text",
						text: `Created issue: ${projectData.identifier}-${sequence} - ${title}`,
					},
				],
				structuredContent: {
					issue: {
						id: issueId,
						identifier: `${projectData.identifier}-${sequence}`,
						title,
					},
				},
			};
		},
	);
}

// Update Issue
export function registerUpdateIssue(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"update_issue",
		{
			title: "Update Issue",
			description: "Update issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				title: z.string().optional().describe("New title"),
				description: z.string().optional().describe("New description (Markdown supported)"),
				status: z.string().optional().describe("New status ID"),
				priority: z.string().optional().describe("New priority"),
				assignee: z.string().optional().describe("New assignee ID"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		async ({
			project,
			identifier,
			title,
			description,
			status,
			priority,
			assignee,
		}) => {
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

			const updates: IssueUpdates = {};
			if (title) updates.title = title;
			if (status) updates.status = status;
			if (assignee !== undefined) updates.assignee = assignee;
			if (priority) {
				updates.priority = stringToPriority(priority);
			}

			// Update basic fields
			if (Object.keys(updates).length > 0) {
				await client.updateDoc(
					tracker.class.Issue,
					projectData._id,
					issue._id,
					updates,
				);
			}

			// Handle description separately (need to upload Markup)
			if (description !== undefined) {
				const descriptionRef = await client.uploadMarkup(
					tracker.class.Issue,
					issue._id,
					"description",
					description,
					"markdown",
				);
				await client.updateDoc(
					tracker.class.Issue,
					projectData._id,
					issue._id,
					{ description: descriptionRef },
				);
			}

			return {
				content: [{ type: "text", text: `Updated issue: ${identifier}` }],
				structuredContent: { success: true },
			};
		},
	);
}

// Set Assignee
export function registerSetAssignee(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"set_assignee",
		{
			title: "Set Assignee",
			description: "Set issue assignee",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				assignee: z
					.string()
					.nullable()
					.describe("Assignee ID (null to unassign)"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		async ({ project, identifier, assignee }) => {
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

			await client.updateDoc(tracker.class.Issue, projectData._id, issue._id, {
				assignee: assignee as Ref<Person> | null,
			});

			return {
				content: [
					{
						type: "text",
						text: `Set assignee of ${identifier} to ${assignee ?? "unassigned"}`,
					},
				],
				structuredContent: { success: true },
			};
		},
	);
}

// Set Milestone
export function registerSetMilestone(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"set_milestone",
		{
			title: "Set Milestone",
			description: "Set issue milestone",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				milestone: z.string().describe("Milestone ID"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		async ({ project, identifier, milestone }) => {
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

			await client.updateDoc(tracker.class.Issue, projectData._id, issue._id, {
				milestone: milestone as Ref<Milestone>,
			});

			return {
				content: [
					{
						type: "text",
						text: `Set milestone of ${identifier} to ${milestone}`,
					},
				],
				structuredContent: { success: true },
			};
		},
	);
}

// Delete Issue
export function registerDeleteIssue(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"delete_issue",
		{
			title: "Delete Issue",
			description: "Delete an issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		async ({ project, identifier }) => {
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

			await client.removeDoc(
				tracker.class.Issue,
				projectData._id,
				issue._id,
			);

			return {
				content: [
					{
						type: "text",
						text: `Deleted issue: ${identifier}`,
					},
				],
				structuredContent: { success: true },
			};
		},
	);
}
