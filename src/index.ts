import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getClient } from "./client.js";
import { loadConfig } from "./config.js";

// Issue tools
import {
	registerCreateIssue,
	registerDeleteIssue,
	registerGetIssue,
	registerListIssues,
	registerSetAssignee,
	registerSetMilestone,
	registerUpdateIssue,
} from "./tools/issue.js";
// Label tools
import { registerAddLabel, registerRemoveLabel } from "./tools/label.js";
import {
	registerAddBlockedBy,
	registerAddRelation,
	registerCreateLabel,
	registerDeleteLabel,
	registerGetMilestone,
	registerListLabels,
	registerListStatuses,
	registerListTaskTypes,
	registerSetParent,
} from "./tools/labelExtended.js";
// Milestone tools
import {
	registerCreateMilestone,
	registerDeleteMilestone,
	registerListMilestones,
} from "./tools/milestone.js";
// Person tools
import { registerGetPerson, registerListPersons } from "./tools/person.js";
// Project tools
import { registerGetProject, registerListProjects } from "./tools/project.js";

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
	// Log but don't crash - MCP can recover
	console.error("[Unhandled Rejection]", reason, "at:", promise);
});

process.on("uncaughtException", (error) => {
	// Log error details but try to keep server alive
	console.error("[Uncaught Exception]", error);
	// Don't exit - let the client handle the failed request
});

// Load configuration
try {
	loadConfig();
} catch (error) {
	console.error(
		"Failed to load configuration:",
		error instanceof Error ? error.message : error,
	);
	process.exit(1);
}

// Create MCP Server
const server = new McpServer({
	name: "huly-mcp-server",
	version: "0.1.0",
});

// Register Issue tools
registerListIssues(server, getClient);
registerGetIssue(server, getClient);
registerCreateIssue(server, getClient);
registerUpdateIssue(server, getClient);
registerDeleteIssue(server, getClient);
registerSetAssignee(server, getClient);
registerSetMilestone(server, getClient);

// Register Project tools
registerListProjects(server, getClient);
registerGetProject(server, getClient);

// Register Milestone tools
registerListMilestones(server, getClient);
registerCreateMilestone(server, getClient);
registerDeleteMilestone(server, getClient);

// Register Person tools
registerListPersons(server, getClient);
registerGetPerson(server, getClient);

// Register Label tools
registerAddLabel(server, getClient);
registerRemoveLabel(server, getClient);
registerListLabels(server, getClient);
registerCreateLabel(server, getClient);
registerDeleteLabel(server, getClient);
registerAddRelation(server, getClient);
registerAddBlockedBy(server, getClient);
registerSetParent(server, getClient);
registerListTaskTypes(server, getClient);
registerListStatuses(server, getClient);
registerGetMilestone(server, getClient);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
