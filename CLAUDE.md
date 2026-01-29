# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format

# Run server
bun run start

# Development mode (with watch)
bun run dev
```

## Architecture

### MCP Server Structure
This is a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes Huly platform operations as MCP tools.

**Entry Point**: `src/index.ts`
- Creates `McpServer` instance
- Registers all tool handlers from `tools/` directory
- Connects via stdio transport

**Client Connection**: `src/client.ts`
- Singleton `getClient()` function returns cached Huly `PlatformClient`
- Handles authentication via token or email/password
- Auto-loads config from environment variables

### Tool Organization

Tools are split across multiple files by domain:

- **`issue.ts`**: Core Issue CRUD (list, get, create, update, delete, set_assignee, set_milestone)
- **`label.ts`**: Label attachment/detachment to issues
- **`labelExtended.ts`**: Label CRUD, issue relations (add_relation, add_blocked_by, set_parent), metadata queries (list_task_types, list_statuses)
- **`milestone.ts`**: Milestone CRUD
- **`person.ts`**: Contact queries
- **project.ts`**: Project queries

### Type Conversions

`src/utils/converters.ts` handles enum ↔ string conversions:
- `priorityToString` / `stringToPriority` (IssuePriority)
- `milestoneStatusToString` / `stringToMilestoneStatus` (MilestoneStatus)

### Huly Platform API Patterns

**Finding Documents**:
```typescript
await client.findOne(tracker.class.Project, { identifier: "HULY" })
await client.findAll(tracker.class.Issue, { space: project._id })
```

**Creating Issues**:
- Increment project `sequence` counter via `updateDoc(..., { $inc: { sequence: 1 } }, true)`
- Use `client.addCollection()` to add to project's `issues` collection
- Issue `identifier` format: `{project.identifier}-{sequence}`

**Descriptions**: Use `client.uploadMarkup()` for markdown content, returns blob reference

**No Cascade Deletes**: Huly's `removeDoc()` does NOT check references. When implementing delete operations, follow Huly's pattern - delete directly without constraint checking.

## Configuration

Required environment variables:
```bash
HULY_WORKSPACE=workspace-identifier
HULY_TOKEN=token  # or HULY_EMAIL + HULY_PASSWORD
HULY_URL=https://huly.app  # optional
```

Config loaded by `src/config.ts` from `.env` or environment.
