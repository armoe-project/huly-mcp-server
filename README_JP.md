# Huly MCP サーバー

[Model Context Protocol](https://modelcontextprotocol.io) サーバーで、[Huly](https://huly.app) プロジェクト管理プラットフォームに接続します。

## 機能

### Issue 管理
- `list_issues` - プロジェクトのIssue一覧を取得
- `get_issue` - Issue詳細を取得
- `create_issue` - 新しいIssueを作成
- `update_issue` - Issueを更新
- `delete_issue` - Issueを削除
- `set_assignee` - 担当者を設定
- `set_milestone` - マイルストーンを設定

### プロジェクト管理
- `list_projects` - すべてのプロジェクトを一覧表示
- `get_project` - プロジェクト詳細を取得

### マイルストーン管理
- `list_milestones` - プロジェクトのマイルストーン一覧
- `get_milestone` - マイルストーン詳細を取得
- `create_milestone` - 新しいマイルストーンを作成
- `delete_milestone` - マイルストーンを削除

### コンタクト管理
- `list_persons` - すべてのコンタクトを一覧表示
- `get_person` - コンタクト詳細を取得

### ラベル管理
- `add_label` - Issueにラベルを追加
- `remove_label` - Issueからラベルを削除
- `list_labels` - すべてのラベルを一覧表示
- `create_label` - 新しいラベルを作成
- `delete_label` - ラベルを削除

### リレーション
- `add_relation` - Issueの関連を追加
- `add_blocked_by` - 依存関係を追加
- `set_parent` - 親Issueを設定（サブタスク）

### メタデータクエリ
- `list_task_types` - タスクタイプを一覧表示
- `list_statuses` - すべてのステータスを一覧表示

## インストール

### 前提条件

- [Bun](https://bun.sh) >= 1.3.0

### 手順

```bash
bun install
```

## 設定

### 環境変数の使用

`.env` ファイルを作成するか、環境変数を設定：

```bash
# 必須
HULY_WORKSPACE=your-workspace-identifier

# 認証（いずれか）
HULY_TOKEN=your-token
# または
HULY_EMAIL=your-email@example.com
HULY_PASSWORD=your-password

# オプション（デフォルト: https://huly.app）
HULY_URL=https://huly.app
```

### 認証情報の取得

1. **Workspace**: ワークスペース識別子（例: `my-company`、`https://huly.app/my-company` から）
2. **Token**: Huly 設定 → アカウント → トークンで生成
3. **Email/Password**: Huly アカウントの認証情報

### Claude Desktop 設定

`~/.claude/claude_desktop_config.json` に追加：

```json
{
  "mcpServers": {
    "huly": {
      "command": "bunx",
      "args": ["@armoe/huly-mcp-server"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_TOKEN": "your-token"
      }
    }
  }
}
```

または npx を使用：

```json
{
  "mcpServers": {
    "huly": {
      "command": "npx",
      "args": ["@armoe/huly-mcp-server"],
      "env": {
        "HULY_WORKSPACE": "your-workspace",
        "HULY_TOKEN": "your-token"
      }
    }
  }
}
```

**⚠️ セ�上注意**: `.mcp.json` は機密情報を含むため `.gitignore` に追加済み。バージョン管理システムにコミットしないでください。

## 使用方法

### スタンドアロン

```bash
# 環境変数を設定
export HULY_WORKSPACE=your-workspace
export HULY_TOKEN=your-token

# サーバーを実行
bun run src/index.ts
```

### 開発モード

```bash
bun run dev
```

## 開発

```bash
# タイプチェック
bun run typecheck

# Lint
bun run lint

# フォーマット自動修正
bun run lint:fix

# フォーマット
bun run format
```

## プロジェクト構造

```
huly-mcp-server/
├── src/
│   ├── client.ts          # Huly API クライアント
│   ├── config.ts          # 設定読み込み
│   ├── index.ts           # サーバーエンリーポイント
│   ├── tools/             # MCP ツール実装
│   │   ├── issue.ts       # Issue 関連ツール
│   │   ├── label.ts       # ラベル関連ツール
│   │   ├── labelExtended.ts # 拡張ラベル・リレーションツール
│   │   ├── milestone.ts   # マイルストーン関連ツール
│   │   ├── person.ts      # コンタクト関連ツール
│   │   └── project.ts     # プロジェクト関連ツール
│   └── utils/             # ユ�ーティリティ関数
│       └── converters.ts  # 型変換関数
├── .mcp.json.example      # MCP 設定テンプレート
└── package.json
```

## ライセンス

GPL-3.0-only

## 関連リンク

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Huly Platform](https://huly.app)
