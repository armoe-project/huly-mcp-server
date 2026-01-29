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

## 安装

### 前置要求

- [Bun](https://bun.sh) >= 1.3.0

### 步骤

```bash
bun install
```

## 配置

### 使用环境变量

创建 `.env` 文件或设置环境变量：

```bash
# 必需
HULY_WORKSPACE=your-workspace-identifier

# 认证（二选一）
HULY_TOKEN=your-token
# 或
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password

# 可选（默认: https://huly.app）
HULY_URL=https://huly.app
```

### 获取凭证

1. **Workspace**: 工作区标识符（例如 `my-company`，来自 `https://huly.app/my-company`）
2. **Token**: 在 Huly 设置 → 账户 → 令牌中生成
3. **Email/Password**: 您的 Huly 账户凭证

### Claude Desktop 配置

添加到 `~/.claude/claude_desktop_config.json`：

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

**⚠️ 安全提示**：`.mcp.json` 包含敏感信息，已添加到 `.gitignore`。请勿将其提交到版本控制系统。

## 使用

### 独立运行

```bash
# 设置环境变量
export HULY_WORKSPACE=your-workspace
export HULY_TOKEN=your-token

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
