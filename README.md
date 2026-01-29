# Huly MCP Server

[Model Context Protocol](https://modelcontextprotocol.io) server for connecting to [Huly](https://huly.app) project management platform.

## Features

### Issue Management
- `list_issues` - List project issues
- `get_issue` - Get issue details
- `create_issue` - Create new issue
- `update_issue` - Update issue
- `delete_issue` - Delete issue
- `set_assignee` - Set assignee
- `set_milestone` - Set milestone

### Project Management
- `list_projects` - List all projects
- `get_project` - Get project details

### Milestone Management
- `list_milestones` - List project milestones
- `get_milestone` - Get milestone details
- `create_milestone` - Create new milestone
- `delete_milestone` - Delete milestone

### Contact Management
- `list_persons` - List all contacts
- `get_person` - Get contact details

### Label Management
- `add_label` - Add label to issue
- `remove_label` - Remove label from issue
- `list_labels` - List all available labels
- `create_label` - Create new label
- `delete_label` - Delete label

### Relations
- `add_relation` - Add issue relation
- `add_blocked_by` - Add dependency
- `set_parent` - Set parent issue (subtask)

### Metadata Queries
- `list_task_types` - List task types
- `list_statuses` - List all statuses

## Installation

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.0

### Steps

```bash
bun install
```

## Configuration

### Using Environment Variables

Create `.env` file or set environment variables:

```bash
# Required
HULY_WORKSPACE=your-workspace-identifier

# Authentication (choose one)
HULY_TOKEN=your-token
# or
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password

# Optional (default: https://huly.app)
HULY_URL=https://huly.app
```

### Getting Credentials

1. **Workspace**: Workspace identifier (e.g. `my-company` from `https://huly.app/my-company`)
2. **Token**: Generate in Huly Settings → Account → Tokens
3. **Email/Password**: Your Huly account credentials

### Claude Desktop Configuration

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "huly": {
      "command": "bun",
      "args": ["run", "/path/to/huly-mcp-server/src/index.ts"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_TOKEN": "your-token"
      }
    }
  }
}
```

**⚠️ Security Note**: `.mcp.json` contains sensitive information and is added to `.gitignore`. Do not commit it to version control.

## Usage

### Standalone

```bash
# Set environment variables
export HULY_WORKSPACE=your-workspace
export HULY_TOKEN=your-token

# Run server
bun run src/index.ts
```

### Development Mode

```bash
bun run dev
```

## Development

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Auto-fix formatting
bun run lint:fix

# Format
bun run format
```

## Project Structure

```
huly-mcp-server/
├── src/
│   ├── client.ts          # Huly API client
│   ├── config.ts          # Configuration loading
│   ├── index.ts           # Server entry
│   ├── tools/             # MCP tools implementation
│   │   ├── issue.ts       # Issue related tools
│   │   ├── label.ts       # Label related tools
│   │   ├── labelExtended.ts # Extended label and relation tools
│   │   ├── milestone.ts   # Milestone related tools
│   │   ├── person.ts      # Contact related tools
│   │   └── project.ts     # Project related tools
│   └── utils/             # Utility functions
│       └── converters.ts  # Type conversion functions
├── .mcp.json.example      # MCP configuration template
└── package.json
```

## License

GPL-3.0-only

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Huly Platform](https://huly.app)
