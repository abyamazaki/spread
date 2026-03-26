# Spread ヘッドレス化計画

## Context

Spread アプリをヘッドレス化し、フロントエンド（Web UI）とバックエンド（API）を分離する。
目的: デプロイ分離（API: Cloud Run $0、UI: Vercel $20 等）、マルチクライアント対応、開発分離、将来の拡張性。

**現状**: アプリは既に約75%がAPI-first。全データ変更操作は fetch→APIルート経由。Server Actions未使用。
**残る結合**: 4つのサーバーコンポーネントが直接Prisma呼出し、NextAuthミドルウェアがNext.jsに密結合。

---

## 推奨アーキテクチャ

### API サーバー: Hono（Next.js API Routes から抽出）

**Hono を選ぶ理由:**
- 超軽量（~14KB）→ Cloud Run 無料枠のメモリ制限(256-512MB)に最適
- Web Standards API（Request/Response）→ Next.js APIルートからの変換がほぼ機械的
- TypeScript-first、CORS/JWT ミドルウェア内蔵
- コールドスタートが最速（~50ms）

### プロジェクト構成: Turborepo モノレポ

```
spread/
├── turbo.json
├── package.json                    # Turborepo root
├── packages/
│   ├── shared/                     # 共有型定義・権限ロジック
│   │   └── src/
│   │       ├── types/index.ts      # CellChange, RowData 等
│   │       └── permissions.ts      # canEditCell, isRowManager（既にフレームワーク非依存）
│   └── prisma/                     # Prisma スキーマ・クライアント
│       ├── schema.prisma
│       └── src/client.ts
└── apps/
    ├── api/                        # Hono API サーバー
    │   ├── Dockerfile
    │   └── src/
    │       ├── index.ts
    │       ├── middleware/          # auth.ts, cors.ts, error-handler.ts
    │       └── routes/             # sheets.ts, change-requests.ts, users.ts 等
    └── web/                        # Next.js フロントエンド（UIのみ）
        └── src/
            ├── app/                # 全ページがクライアントコンポーネント
            ├── components/
            └── lib/
                └── api-client.ts   # APIクライアント（ベースURL設定可）
```

### 認証: 自前JWT（NextAuth を置換）

- `POST /api/v1/auth/login` → アクセストークン(15分) + リフレッシュトークン(7日) 発行
- `POST /api/v1/auth/refresh` → トークン更新
- `GET /api/v1/auth/me` → 現在のユーザー情報
- Hono ミドルウェアで JWT 検証（`jose` ライブラリ使用）
- Web フロントは `AuthProvider` でトークン管理

---

## 実装フェーズ

### Phase 0: モノレポ基盤構築（1日）

**ゴール**: Turborepo 化、共有パッケージ抽出。既存アプリは動作維持。

1. `turbo.json` 作成、既存プロジェクトを `apps/web/` に移動
2. `packages/shared/` 作成:
   - `src/lib/permissions.ts` → `packages/shared/src/permissions.ts`（フレームワーク非依存なのでそのまま移動）
   - `src/types/index.ts` → `packages/shared/src/types/index.ts`（NextAuth型拡張は `apps/web/` に残す）
3. `packages/prisma/` 作成:
   - `prisma/schema.prisma` → `packages/prisma/schema.prisma`
   - `src/lib/prisma.ts` → `packages/prisma/src/client.ts`
4. `apps/web/` のインポートパスを更新、ビルド・動作確認

---

### Phase 1: APIルート補完・標準化（1-2日）

**ゴール**: サーバーコンポーネント廃止に必要なAPIエンドポイントを整備。

1. **`GET /api/sheets/[sheetId]` 拡張** — `_count.changeRequests` を include に追加
   - 対象: `src/app/api/sheets/[sheetId]/route.ts`
2. **`GET /api/change-requests/[requestId]` 拡張** — `cells` の include に `row: { select: { data: true } }` 追加
   - 対象: `src/app/api/change-requests/[requestId]/route.ts`
3. **`GET /api/auth/me` 新規作成** — セッションからユーザー情報を返す
4. **API レスポンス標準化ヘルパー** 作成（`src/lib/api-response.ts`）
   - 成功: `{ data: {...} }`、エラー: `{ error: { code, message } }`

---

### Phase 2: サーバーコンポーネント → クライアントコンポーネント変換（1-2日）

**ゴール**: 全ページが API 経由でデータ取得。Prisma 直接呼出しゼロ。

変換対象 4ファイル:

| ファイル | 現在の直接呼出し | 変換後のAPI呼出し |
|---------|-----------------|-----------------|
| `src/app/sheets/page.tsx` | `prisma.sheet.findMany()` | `fetch("/api/sheets")` |
| `src/app/sheets/[sheetId]/page.tsx` | `prisma.sheet.findUnique()` + `auth()` | `fetch("/api/sheets/${id}")` + `fetch("/api/auth/me")` |
| `src/app/sheets/[sheetId]/requests/page.tsx` | `prisma.sheet.findUnique()` + `prisma.changeRequest.findMany()` | `fetch("/api/change-requests?sheetId=${id}")` |
| `src/app/sheets/[sheetId]/requests/[requestId]/page.tsx` | `prisma.changeRequest.findUnique()` + `auth()` | `fetch("/api/change-requests/${id}")` + `fetch("/api/auth/me")` |

追加作業:
- `src/lib/api-client.ts` 作成 — ベースURL設定可能な fetch ラッパー
- 全コンポーネントの fetch を `apiClient` 経由に統一

**チェックポイント**: この時点で Next.js アプリは純粋にフロントエンド化。API ルートを通じてのみデータアクセス。

---

### Phase 3: Hono API サーバー構築（2-3日）

**ゴール**: 独立してデプロイ可能な API サーバー。

1. `apps/api/` セットアップ（hono, @hono/node-server, jose, bcryptjs）
2. **認証ミドルウェア**: JWT 検証、ユーザー情報を Context に注入
3. **CORS ミドルウェア**: Hono 内蔵 `cors()` 使用
4. **エラーハンドリングミドルウェア**: Prisma エラーの HTTP ステータスマッピング
5. **ルート移植** — Next.js API ルートから Hono に変換（15エンドポイント + 認証3エンドポイント）

変換例:
```typescript
// Before (Next.js): src/app/api/sheets/route.ts
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sheets = await prisma.sheet.findMany({ ... });
  return NextResponse.json(sheets);
}

// After (Hono): apps/api/src/routes/sheets.ts
app.get("/api/v1/sheets", authMiddleware, async (c) => {
  const user = c.get("user");
  const sheets = await prisma.sheet.findMany({ ... });
  return c.json({ data: sheets });
});
```

6. **Prisma スキーマ追加** — RefreshToken モデル（リフレッシュトークンのハッシュ保存用）
7. **ヘルスチェック** — `GET /healthz`
8. **Dockerfile** 作成

---

### Phase 4: Web フロントエンドを外部API接続に切替（1-2日）

**ゴール**: Web アプリが外部の Hono API を呼び出す構成に。

1. `api-client.ts` のベースURLを環境変数化: `NEXT_PUBLIC_API_URL`
2. **NextAuth 除去**:
   - `SessionProvider` → カスタム `AuthProvider`（JWT トークン管理）
   - `useSession()` → カスタム `useAuth()` フック
   - `signIn()` → `POST /api/v1/auth/login` 直接呼出し
   - `signOut()` → トークン破棄 + `POST /api/v1/auth/logout`
3. **ミドルウェア除去**: `src/middleware.ts` 削除 → `AuthProvider` でルート保護（未認証 → `/login` リダイレクト）
4. **`src/app/api/` ディレクトリ全削除**（API は Hono に移行済み）
5. `next.config.ts` に開発用プロキシ追加:
   ```typescript
   rewrites: () => [{ source: "/api/:path*", destination: "http://localhost:3001/api/:path*" }]
   ```
6. 全フロー結合テスト

---

### Phase 5: デプロイ・仕上げ（1-2日）

1. **API → Cloud Run**: Docker ビルド・デプロイ、環境変数設定（DATABASE_URL, JWT_SECRET, CORS_ORIGINS）
2. **Web → Vercel**: `NEXT_PUBLIC_API_URL` を Cloud Run URL に設定
3. API ドキュメント作成（Hono の `@hono/swagger-ui` 活用）
4. リクエストログ・レートリミティング追加（任意）

---

## 主要ファイルの変更・作成・削除一覧

### 変更
| ファイル | 変更内容 | Phase |
|---------|---------|-------|
| `src/app/api/sheets/[sheetId]/route.ts` | `_count.changeRequests` 追加 | 1 |
| `src/app/api/change-requests/[requestId]/route.ts` | `row.data` を cells include に追加 | 1 |
| `src/app/sheets/page.tsx` | サーバー → クライアントコンポーネント | 2 |
| `src/app/sheets/[sheetId]/page.tsx` | サーバー → クライアントコンポーネント | 2 |
| `src/app/sheets/[sheetId]/requests/page.tsx` | サーバー → クライアントコンポーネント | 2 |
| `src/app/sheets/[sheetId]/requests/[requestId]/page.tsx` | サーバー → クライアントコンポーネント | 2 |
| `src/components/providers.tsx` | SessionProvider → AuthProvider | 4 |
| `src/components/layout/header.tsx` | useSession/signOut → useAuth | 4 |
| `src/app/login/page.tsx` | signIn → 直接API呼出し | 4 |
| `next.config.ts` | 開発用 rewrites 追加 | 4 |

### 新規作成
| ファイル | 用途 | Phase |
|---------|------|-------|
| `turbo.json` | Turborepo 設定 | 0 |
| `packages/shared/src/permissions.ts` | 権限ロジック（既存から移動） | 0 |
| `packages/shared/src/types/index.ts` | 共有型定義 | 0 |
| `packages/prisma/src/client.ts` | Prisma クライアント | 0 |
| `src/app/api/auth/me/route.ts` | 現在のユーザー情報API | 1 |
| `src/lib/api-client.ts` | API クライアントラッパー | 2 |
| `apps/api/src/index.ts` | Hono エントリーポイント | 3 |
| `apps/api/src/middleware/auth.ts` | JWT 検証ミドルウェア | 3 |
| `apps/api/src/routes/*.ts` | 各APIルート（8ファイル） | 3 |
| `apps/api/Dockerfile` | Cloud Run 用 | 5 |

### 削除（Phase 4）
| ファイル | 理由 |
|---------|------|
| `src/middleware.ts` | NextAuth ミドルウェア不要 |
| `src/lib/auth.ts` | NextAuth 設定不要 |
| `src/lib/auth.config.ts` | NextAuth Edge 設定不要 |
| `src/app/api/` (全体) | Hono に移行済み |

---

## 工数見積もり

| Phase | 内容 | 工数 |
|-------|------|------|
| Phase 0 | モノレポ基盤構築 | 1日 |
| Phase 1 | APIルート補完・標準化 | 1-2日 |
| Phase 2 | サーバーコンポーネント変換 | 1-2日 |
| Phase 3 | Hono APIサーバー構築 | 2-3日 |
| Phase 4 | Web→外部API接続切替 | 1-2日 |
| Phase 5 | デプロイ・仕上げ | 1-2日 |
| **合計** | | **7-12日** |

※ Phase 2 と Phase 3 は並行可能 → **5-8日に圧縮可**

---

## 検証方法

各フェーズ完了時:
1. `npm run build` が成功すること
2. 全ページの表示・操作が正常に動作すること
3. ログイン→シート一覧→シート詳細→セル編集→変更リクエスト→承認/却下 の一連フローが通ること
4. 管理者ページでユーザーCRUD が動作すること
5. パスワード変更が動作すること

Phase 3 以降追加:
6. `curl` で Hono API の各エンドポイントが正常応答すること
7. CORS が正しく動作すること（ブラウザからのクロスオリジンリクエスト）
8. JWT トークンの発行・検証・リフレッシュが正常に動作すること