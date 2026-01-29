import type { PlatformClient } from "@hcengineering/api-client";
import { generateId } from "@hcengineering/core";
import tags from "@hcengineering/tags";
import task from "@hcengineering/task";
import tracker, { type Issue } from "@hcengineering/tracker";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { milestoneStatusToString } from "../utils/converters.js";
import { wrapTool } from "../utils/error-handler.js";

// Helper to parse issue ID and get issue
async function parseAndFindIssue(
	client: PlatformClient,
	issueId: string,
): Promise<{
	project: { _id: string; identifier: string; _class: string };
	issue: Issue;
}> {
	const match = issueId.match(/^([A-Z0-9]+)-(\d+)$/i);
	if (!match) {
		throw new Error(
			`Invalid issue ID format: ${issueId}. Expected format: PROJECT-NUMBER`,
		);
	}

	const [, projectId, issueNum] = match;

	if (!projectId || !issueNum) {
		throw new Error(`Invalid issue ID format: ${issueId}`);
	}

	const project = await client.findOne(tracker.class.Project, {
		identifier: (projectId as string).toUpperCase(),
	});

	if (!project) {
		throw new Error(`Project not found: ${projectId}`);
	}

	const issue = await client.findOne(tracker.class.Issue, {
		space: project._id,
		number: parseInt(issueNum as string, 10),
	});

	if (!issue) {
		throw new Error(`Issue not found: ${issueId}`);
	}

	return { project, issue };
}

// List Labels
export function registerListLabels(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_labels",
		{
			title: "List Labels",
			description: "List all available labels",
			inputSchema: {},
			outputSchema: {
				labels: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						color: z.string().nullable(),
					}),
				),
			},
		},
		wrapTool(async () => {
			const client = await getClient();

			const tagElements = await client.findAll(tags.class.TagElement, {
				targetClass: tracker.class.Issue,
			});

			return {
				content: [
					{
						type: "text",
						text: `Found ${tagElements.length} label(s):\n${tagElements.map((t) => `- ${t.title}`).join("\n")}`,
					},
				],
				structuredContent: {
					labels: tagElements.map((t) => ({
						id: t._id,
						name: t.title,
						color: t.color ? `#${t.color.toString(16).padStart(6, "0")}` : null,
					})),
				},
			};
		}),
	);
}

// Create Label
export function registerCreateLabel(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"create_label",
		{
			title: "Create Label",
			description: "Create a new label",
			inputSchema: {
				name: z.string().describe("Label name"),
				color: z
					.number()
					.optional()
					.describe("Label color (hexadecimal number, e.g. 0xFF6B6B)"),
			},
			outputSchema: {
				label: z.object({
					id: z.string(),
					name: z.string(),
				}),
			},
		},
		wrapTool(async ({ name, color }) => {
			const client = await getClient();

			// Check if exists
			const existing = await client.findOne(tags.class.TagElement, {
				title: name,
				targetClass: tracker.class.Issue,
			});

			if (existing) {
				return {
					content: [
						{
							type: "text",
							text: `Label "${name}" already exists`,
						},
					],
					structuredContent: {
						label: {
							id: existing._id,
							name,
						},
					},
				};
			}

			// Get a project space for the tag
			const projects = await client.findAll(tracker.class.Project, {});
			const space =
				projects.length > 0 && projects[0]
					? projects[0]._id
					: "tracker:project:Default";

			const tagId = generateId();
			await client.createDoc(
				tags.class.TagElement,
				space as `tracker:project:${string}`,
				{
					title: name,
					targetClass: tracker.class.Issue,
					description: "",
					color: color || 0x4ecdc4,
					category: "tracker:category:Other",
				},
				tagId,
			);

			return {
				content: [
					{
						type: "text",
						text: `Created label: ${name}`,
					},
				],
				structuredContent: {
					label: {
						id: tagId,
						name,
					},
				},
			};
		}),
	);
}

// Delete Label
export function registerDeleteLabel(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"delete_label",
		{
			title: "Delete Label",
			description: "Delete a label",
			inputSchema: {
				name: z.string().describe("Label name"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ name }) => {
			const client = await getClient();

			const tagElement = await client.findOne(tags.class.TagElement, {
				title: name,
				targetClass: tracker.class.Issue,
			});

			if (!tagElement) {
				throw new Error(`Label "${name}" not found`);
			}

			await client.removeDoc(
				tags.class.TagElement,
				tagElement.space,
				tagElement._id,
			);

			return {
				content: [
					{
						type: "text",
						text: `Deleted label: ${name}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}

// Add Relation
export function registerAddRelation(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"add_relation",
		{
			title: "Add Relation",
			description: "Add a relation between two issues",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Issue identifier"),
				relatedToIdentifier: z.string().describe("Related issue identifier"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project: _project, identifier, relatedToIdentifier }) => {
			const client = await getClient();

			const { project, issue } = await parseAndFindIssue(client, identifier);
			const { issue: relatedIssue } = await parseAndFindIssue(
				client,
				relatedToIdentifier,
			);

			// Get current relations or initialize empty array
			const currentRelations = issue.relations || [];

			// Check if relation already exists
			const alreadyRelated = currentRelations.some(
				(r) => r._id === relatedIssue._id,
			);
			if (alreadyRelated) {
				return {
					content: [
						{
							type: "text",
							text: `Issues already related`,
						},
					],
					structuredContent: { success: true },
				};
			}

			// Add the new relation
			const newRelations = [
				...currentRelations,
				{ _id: relatedIssue._id, _class: relatedIssue._class },
			];

			await client.updateDoc(tracker.class.Issue, project._id, issue._id, {
				relations: newRelations,
			});

			return {
				content: [
					{
						type: "text",
						text: `Added relation: ${identifier} -> ${relatedToIdentifier}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}

// Add Blocked By
export function registerAddBlockedBy(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"add_blocked_by",
		{
			title: "Add Blocked By",
			description: "Add dependency: first issue is blocked by second issue",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Blocked issue identifier"),
				blockedByIdentifier: z.string().describe("Blocking issue identifier"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project: _project, identifier, blockedByIdentifier }) => {
			const client = await getClient();

			const { project, issue } = await parseAndFindIssue(client, identifier);
			const { issue: blockingIssue } = await parseAndFindIssue(
				client,
				blockedByIdentifier,
			);

			// Get current blockedBy or initialize empty array
			const currentBlockedBy = issue.blockedBy || [];

			// Check if already blocked by this issue
			const alreadyBlocked = currentBlockedBy.some(
				(r) => r._id === blockingIssue._id,
			);
			if (alreadyBlocked) {
				return {
					content: [
						{
							type: "text",
							text: `${identifier} already blocked by ${blockedByIdentifier}`,
						},
					],
					structuredContent: { success: true },
				};
			}

			// Add the new blocking relation
			const newBlockedBy = [
				...currentBlockedBy,
				{ _id: blockingIssue._id, _class: blockingIssue._class },
			];

			await client.updateDoc(tracker.class.Issue, project._id, issue._id, {
				blockedBy: newBlockedBy,
			});

			return {
				content: [
					{
						type: "text",
						text: `Added dependency: ${identifier} blocked by ${blockedByIdentifier}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}

// Set Parent
export function registerSetParent(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"set_parent",
		{
			title: "Set Parent",
			description: "Set parent issue (e.g. link a task to an epic)",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				identifier: z.string().describe("Child issue identifier"),
				parentIdentifier: z.string().describe("Parent issue identifier"),
			},
			outputSchema: {
				success: z.boolean(),
			},
		},
		wrapTool(async ({ project: _project, identifier, parentIdentifier }) => {
			const client = await getClient();

			const { project, issue } = await parseAndFindIssue(client, identifier);
			const { project: parentProject, issue: parentIssue } =
				await parseAndFindIssue(client, parentIdentifier);

			// Build parent info for the child
			const parentInfo = {
				parentId: parentIssue._id,
				identifier: `${parentProject.identifier}-${parentIssue.number}`,
				parentTitle: parentIssue.title,
				space: parentProject._id,
			};

			// Use updateCollection to properly register in the subIssues collection
			await client.updateCollection(
				tracker.class.Issue,
				project._id,
				issue._id,
				parentIssue._id,
				tracker.class.Issue,
				"subIssues",
				{
					parents: [parentInfo],
					attachedTo: parentIssue._id,
					attachedToClass: tracker.class.Issue,
					collection: "subIssues",
				},
			);

			// Build child info for the parent
			const childInfo = {
				childId: issue._id,
				estimation: issue.estimation || 0,
				reportedTime: issue.reportedTime || 0,
			};

			// Get current childInfo array from parent and add new child
			const currentChildInfo = parentIssue.childInfo || [];

			// Check if child is already in the list
			const existingIndex = currentChildInfo.findIndex(
				(c) => c.childId === issue._id,
			);
			let updatedChildInfo: Array<{
				childId: string;
				estimation: number;
				reportedTime: number;
			}>;
			if (existingIndex >= 0) {
				updatedChildInfo = [...currentChildInfo];
				updatedChildInfo[existingIndex] = childInfo;
			} else {
				updatedChildInfo = [...currentChildInfo, childInfo];
			}

			// Update parent's childInfo array and subIssues counter
			await client.updateDoc(
				tracker.class.Issue,
				parentProject._id,
				parentIssue._id,
				{
					childInfo: updatedChildInfo,
					subIssues: updatedChildInfo.length,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Set parent issue: ${identifier} is now a child of ${parentIdentifier}`,
					},
				],
				structuredContent: { success: true },
			};
		}),
	);
}

// List Task Types
export function registerListTaskTypes(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_task_types",
		{
			title: "List Task Types",
			description: "List all task types for a project (e.g. Issue, Epic, Bug)",
			inputSchema: {
				project: z.string().describe("Project identifier"),
			},
			outputSchema: {
				taskTypes: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						description: z.string(),
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

			// Query all task types
			const taskTypes = await client.findAll(task.class.TaskType, {});

			// Filter to task types relevant to tracker/Issue
			const relevantTypes = taskTypes.filter(
				(tt) =>
					tt.ofClass === tracker.class.Issue ||
					tt.targetClass === tracker.class.Issue ||
					tt.descriptor?.includes("tracker"),
			);

			return {
				content: [
					{
						type: "text",
						text: `Found ${relevantTypes.length} task type(s):\n${relevantTypes.map((tt) => `- ${tt.name || tt._id.split(":").pop()}`).join("\n")}`,
					},
				],
				structuredContent: {
					taskTypes: relevantTypes.map((tt) => ({
						id: tt._id,
						name: tt.name || tt._id.split(":").pop(),
						description:
							typeof tt.descriptor === "string"
								? tt.descriptor
								: Array.isArray(tt.descriptor)
									? tt.descriptor.join(", ")
									: "",
					})),
				},
			};
		}),
	);
}

// List Statuses
export function registerListStatuses(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_statuses",
		{
			title: "List Statuses",
			description: "List all available issue statuses in the workspace",
			inputSchema: {},
			outputSchema: {
				statuses: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						category: z.string(),
					}),
				),
			},
		},
		wrapTool(async () => {
			const client = await getClient();

			const statuses = await client.findAll(tracker.class.IssueStatus, {});

			return {
				content: [
					{
						type: "text",
						text: `Found ${statuses.length} status(es):\n${statuses.map((s) => `- ${s.name}`).join("\n")}`,
					},
				],
				structuredContent: {
					statuses: statuses.map((s) => ({
						id: s._id,
						name: s.name,
						category: s.category || "",
					})),
				},
			};
		}),
	);
}

// Get Milestone
export function registerGetMilestone(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"get_milestone",
		{
			title: "Get Milestone",
			description: "Get milestone details",
			inputSchema: {
				project: z.string().describe("Project identifier"),
				label: z.string().describe("Milestone name"),
			},
			outputSchema: {
				milestone: z.object({
					id: z.string(),
					label: z.string(),
					description: z.string(),
					status: z.string(),
					targetDate: z.string().nullable(),
					issueCount: z.number(),
				}),
			},
		},
		async ({ project, label }) => {
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

			// Count issues in this milestone
			const issues = await client.findAll(tracker.class.Issue, {
				space: projectData._id,
				milestone: milestone._id,
			});

			const statusStr = milestoneStatusToString(milestone.status);

			return {
				content: [
					{
						type: "text",
						text: `Milestone: ${milestone.label}\nStatus: ${statusStr}\nIssues: ${issues.length}`,
					},
				],
				structuredContent: {
					milestone: {
						id: milestone._id,
						label: milestone.label,
						description: milestone.description || "",
						status: statusStr,
						targetDate: milestone.targetDate
							? new Date(milestone.targetDate).toISOString()
							: null,
						issueCount: issues.length,
					},
				},
			};
		},
	);
}
