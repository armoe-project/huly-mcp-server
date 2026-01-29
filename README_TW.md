# Huly MCP 伺服器

[Model Context Protocol](https://modelcontextprotocol.io) 伺服器，用於連接 [Huly](https://huly.app) 專案管理平台。

## 功能

### Issue 管理
- `list_issues` - 查詢專案 Issue 列表
- `get_issue` - 獲取 Issue 詳細
- `create_issue` - 建立新 Issue
- `update_issue` - 更新 Issue
- `delete_issue` - 刪除 Issue
- `set_assignee` - 設定受理人
- `set_milestone` - 設定里程碑

### 專案管理
- `list_projects` - 列出所有專案
- `get_project` - 獲取專案詳情

### 里程碑管理
- `list_milestones` - 列出專案里程碑
- `get_milestone` - 獲取里程碑詳情
- `create_milestone` - 建立新里程碑
- `delete_milestone` - 刪除里程碑

### 聯絡人管理
- `list_persons` - 列出所有聯絡人
- `get_person` - 獲取聯絡人詳情

### 標籤管理
- `add_label` - 給 Issue 新增標籤
- `remove_label` - 從 Issue 移除標籤
- `list_labels` - 列出所有可用標籤
- `create_label` - 建立新標籤
- `delete_label` - 刪除標籤

### 關聯關係
- `add_relation` - 新增 Issue 關聯關係
- `add_blocked_by` - 新增依賴關係
- `set_parent` - 設定父 Issue（子任務）

### 元數據查詢
- `list_task_types` - 列出任務類型
- `list_statuses` - 列出所有狀態

## 安裝

### 前置要求

- [Bun](https://bun.sh) >= 1.3.0

### 步驟

```bash
bun install
```

## 配置

### 使用環境變數

建立 `.env` 檔案或設定環境變數：

```bash
# 必需
HULY_WORKSPACE=your-workspace-identifier

# 認證（二選一）
HULY_TOKEN=your-token
# 或
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password

# 可選（預設: https://huly.app）
HULY_URL=https://huly.app
```

### 取得憑證

1. **Workspace**: 工作區識別碼（例如 `my-company`，來自 `https://huly.app/my-company`）
2. **Token**: 在 Huly 設定 → 賬戶 → 令牌中產生
3. **Email/Password**: 您的 Huly 賬戶憑證

### Claude Desktop 配置

新增到 `~/.claude/claude_desktop_config.json`：

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

**⚠️ 安全提示**：`.mcp.json` 包含敏感資訊，已新增到 `.gitignore`。請勿將其提交到版本控制系統。

## 使用

### 獨立執行

```bash
# 設定環境變數
export HULY_WORKSPACE=your-workspace
export HULY_TOKEN=your-token

# 執行伺服器
bun run src/index.ts
```

### 開發模式

```bash
bun run dev
```

## 開發

```bash
# 類型檢查
bun run typecheck

# Lint
bun run lint

# 自動修復格式
bun run lint:fix

# 格式化
bun run format
```

## 專案結構

```
huly-mcp-server/
├── src/
│   ├── client.ts          # Huly API 客戶端
│   ├── config.ts          # 配置載入
│   ├── index.ts           # 伺服器入口
│   ├── tools/             # MCP 工具實作
│   │   ├── issue.ts       # Issue 相關工具
│   │   ├── label.ts       # 標籤相關工具
│   │   ├── labelExtended.ts # 擴展標籤和關係工具
│   │   ├── milestone.ts   # 里程碑相關工具
│   │   ├── person.ts      # 聯絡人相關工具
│   │   └── project.ts     # 專案相關工具
│   └── utils/             # 工具函式
│       └── converters.ts  # 類型轉換函式
├── .mcp.json.example      # MCP 配置模板
└── package.json
```

## 授權

GPL-3.0-only

## 相關連結

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Huly Platform](https://huly.app)
