import type { PlatformClient } from "@hcengineering/api-client";
import contact from "@hcengineering/contact";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { wrapTool } from "../utils/error-handler.js";

// List Persons
export function registerListPersons(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"list_persons",
		{
			title: "List Persons",
			description: "List all contacts",
			inputSchema: {
				limit: z.number().optional().describe("Result limit, default 50"),
			},
			outputSchema: {
				persons: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						city: z.string().nullable(),
					}),
				),
			},
		},
		wrapTool(async ({ limit = 50 }) => {
			const client = await getClient();

			const persons = await client.findAll(contact.class.Person, {}, { limit });

			return {
				content: [
					{
						type: "text",
						text: `Found ${persons.length} contact(s):\n${persons.map((p) => `- ${p.name}${p.city ? ` (${p.city})` : ""}`).join("\n")}`,
					},
				],
				structuredContent: {
					persons: persons.map((p) => ({
						id: p._id,
						name: p.name,
						city: p.city ?? null,
					})),
				},
			};
		}),
	);
}

// Get Person
export function registerGetPerson(
	server: McpServer,
	getClient: () => Promise<PlatformClient>,
) {
	server.registerTool(
		"get_person",
		{
			title: "Get Person",
			description: "Get contact details",
			inputSchema: {
				name: z.string().describe("Contact name"),
			},
			outputSchema: {
				person: z.object({
					id: z.string(),
					name: z.string(),
					city: z.string().nullable(),
					channels: z.array(
						z.object({
							type: z.string(),
							value: z.string(),
						}),
					),
				}),
			},
		},
		wrapTool(async ({ name }) => {
			const client = await getClient();

			const persons = await client.findAll(contact.class.Person, {
				name: { $like: `%${name}%` },
			});

			if (persons.length === 0) {
				throw new Error(`Person "${name}" not found`);
			}

			const person = persons[0];

			const channels = await client.findAll(contact.class.Channel, {
				attachedTo: person._id,
				attachedToClass: person._class,
			});

			return {
				content: [
					{
						type: "text",
						text: `Contact: ${person.name ?? "unknown"}\nCity: ${person.city ?? "unknown"}\nChannels:\n${channels.map((c) => `- ${c.value}`).join("\n") || "none"}`,
					},
				],
				structuredContent: {
					person: {
						id: person._id,
						name: person.name ?? "unknown",
						city: person.city ?? null,
						channels: channels.map((c) => ({
							type: c.provider,
							value: c.value,
						})),
					},
				},
			};
		}),
	);
}
