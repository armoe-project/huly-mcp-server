# Huly MCP 服务器

[Model Context Protocol](https://modelcontextprotocol.io) 服务器，用于连接 [Huly](https://huly.app) 项目管理平台。

## 功能

### Issue 管理
- `list_issues` - 查询项目 Issue 列表
- `get_issue` - 获取 Issue 详情
- `create_issue` - 创建新 Issue
- `update_issue` - 更新 Issue
- `delete_issue` - 删除 Issue
- `set_assignee` - 设置受理人
- `set_milestone` - 设置里程碑

### 项目管理
- `list_projects` - 列出所有项目
- `get_project` - 获取项目详情

### 里程碑管理
- `list_milestones` - 列出项目里程碑
- `get_milestone` - 获取里程碑详情
- `create_milestone` - 创建新里程碑
- `delete_milestone` - 删除里程碑

### 联系人管理
- `list_persons` - 列出所有联系人
- `get_person` - 获取联系人详情

### 标签管理
- `add_label` - 给 Issue 添加标签
- `remove_label` - 从 Issue 移除标签
- `list_labels` - 列出所有可用标签
- `create_label` - 创建新标签
- `delete_label` - 删除标签

### 关联关系
- `add_relation` - 添加 Issue 关联关系
- `add_blocked_by` - 添加依赖关系
- `set_parent` - 设置父 Issue（子任务）

### 元数据查询
- `list_task_types` - 列出任务类型
- `list_statuses` - 列出所有状态

## 配置

### 获取凭证

1. **Workspace**: 工作区标识符（例如 `my-company`，来自 `https://huly.app/my-company`）
2. **Email/Password**: 您的 Huly 账户凭证

### 环境变量

```bash
# 必需
HULY_WORKSPACE=your-workspace-identifier
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password

# 可选（默认: https://huly.app）
HULY_URL=https://huly.app
```

### CC-Switch

在 CC-Switch 中点击右上角 "MCP" 按钮：

1. 点击 "添加服务器"
2. 配置：
   - **名称**: `huly`
   - **传输**: `stdio`
   - **命令**: `bunx`
   - **参数**: `["@armoe/huly-mcp-server@latest"]`
   - **环境变量**:
     ```
     HULY_WORKSPACE=your-workspace
     HULY_EMAIL=your-email@example.com
     HULY_PASSWORD=your-password
     ```
3. 启用服务器以同步到应用程序

### Cherry Studio

在 Cherry Studio 设置中添加新的 MCP 服务器：

```json
{
  "name": "huly",
  "command": "bunx",
  "args": ["@armoe/huly-mcp-server@latest"],
  "env": {
    "HULY_WORKSPACE": "your-workspace",
    "HULY_EMAIL": "your-email@example.com",
    "HULY_PASSWORD": "your-password"
  }
}
```

### Claude Desktop

添加到 `~/.claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "huly": {
      "command": "bunx",
      "args": ["@armoe/huly-mcp-server@latest"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_EMAIL": "your-email@example.com",
        "HULY_PASSWORD": "your-password"
      }
    }
  }
}
```

### Claude Code

添加到 `.claude/mcp.json`：

```json
{
  "mcpServers": {
    "huly": {
      "command": "bunx",
      "args": ["@armoe/huly-mcp-server@latest"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_EMAIL": "your-email@example.com",
        "HULY_PASSWORD": "your-password"
      }
    }
  }
}
```

### Cursor

添加到 VSCode 设置 (`settings.json`)：

```json
{
  "mcpServers": {
    "huly": {
      "command": "bunx",
      "args": ["@armoe/huly-mcp-server@latest"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_EMAIL": "your-email@example.com",
        "HULY_PASSWORD": "your-password"
      }
    }
  }
}
```

### Cline (VSCode 扩展)

添加到 VSCode 设置：

```json
{
  "cline.mcpServers": {
    "huly": {
      "command": "bunx",
      "args": ["@armoe/huly-mcp-server@latest"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_EMAIL": "your-email@example.com",
        "HULY_PASSWORD": "your-password"
      }
    }
  }
}
```

## 安装

### 前置要求

- [Bun](https://bun.sh) >= 1.3.0

### 从 npm 安装（推荐）

```bash
bunx @armoe/huly-mcp-server@latest
```

### 从源码安装

```bash
git clone https://github.com/armoe/huly-mcp-server.git
cd huly-mcp-server
bun install
```

## 使用

### 独立运行

```bash
# 设置环境变量
export HULY_WORKSPACE=your-workspace
export HULY_EMAIL=your-email@example.com
export HULY_PASSWORD=your-password

# 运行服务器
bun run src/index.ts
```

### 开发模式

```bash
bun run dev
```

## 开发

```bash
# 类型检查
bun run typecheck

# Lint
bun run lint

# 自动修复格式
bun run lint:fix

# 格式化
bun run format
```

## 项目结构

```
huly-mcp-server/
├── src/
│   ├── client.ts          # Huly API 客户端
│   ├── config.ts          # 配置加载
│   ├── index.ts           # 服务器入口
│   ├── tools/             # MCP 工具实现
│   │   ├── issue.ts       # Issue 相关工具
│   │   ├── label.ts       # 标签相关工具
│   │   ├── labelExtended.ts # 扩展标签和关系工具
│   │   ├── milestone.ts   # 里程碑相关工具
│   │   ├── person.ts      # 联系人相关工具
│   │   └── project.ts     # 项目相关工具
│   └── utils/             # 工具函数
│       └── converters.ts  # 类型转换函数
├── .mcp.json.example      # MCP 配置模板
└── package.json
```

## 许可证

GPL-3.0-only

## 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Huly Platform](https://huly.app)
