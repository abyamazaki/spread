# Spread - データ管理システム 開発ドキュメント

## 目次

1. [システム概要](#1-システム概要)
2. [技術スタック](#2-技術スタック)
3. [環境構築手順](#3-環境構築手順)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データベース設計](#5-データベース設計)
6. [認証・認可設計](#6-認証認可設計)
7. [画面設計・ルーティング](#7-画面設計ルーティング)
8. [API 設計](#8-api-設計)
9. [コンポーネント設計](#9-コンポーネント設計)
10. [権限システム設計](#10-権限システム設計)
11. [業務フロー設計](#11-業務フロー設計)
12. [ステップバイステップ実装ガイド](#12-ステップバイステップ実装ガイド)
13. [デプロイ手順](#13-デプロイ手順)
14. [テストアカウント](#14-テストアカウント)

---

## 1. システム概要

### 1.1 システム名
**Spread** - CSV データ管理・変更承認ワークフローシステム

### 1.2 目的
CSV ファイルをインポートしてスプレッドシート形式で表示・編集し、変更内容を承認ワークフローを通じて管理する Web アプリケーション。

### 1.3 主要機能
| 機能 | 説明 |
|------|------|
| CSV インポート | CSV ファイルをアップロードしてシートとして管理 |
| スプレッドシート表示 | ページネーション付きの表形式データ表示・インライン編集 |
| 変更承認ワークフロー | 変更 → 申請 → 承認/却下/取り下げ の承認フロー |
| ユーザー管理 | 管理者によるユーザー CRUD、ロール管理 |
| 権限管理 | シート管理者・行管理者・カラムロックの 3 層権限 |
| パスワード変更 | 全ユーザーが自身のパスワードを変更可能 |

### 1.4 システム構成図

```
┌──────────────────────────────────────────────────┐
│                   ブラウザ (React)                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐  │
│  │ ログイン │ │シート表示│ │変更申請 │ │ユーザー管理│  │
│  └────────┘ └────────┘ └────────┘ └───────────┘  │
└───────────────────────┬──────────────────────────┘
                        │ fetch (REST API)
┌───────────────────────┼──────────────────────────┐
│               Next.js App Router                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐  │
│  │NextAuth│ │API Route│ │Middleware│ │  SSR Page │  │
│  └────────┘ └────────┘ └────────┘ └───────────┘  │
└───────────────────────┬──────────────────────────┘
                        │ Prisma ORM
┌───────────────────────┼──────────────────────────┐
│               PostgreSQL (Neon DB)                 │
│  ┌─────┐ ┌──────┐ ┌────┐ ┌──────────┐ ┌───────┐ │
│  │User │ │Sheet │ │Row │ │ChangeReq │ │ChgCell│ │
│  └─────┘ └──────┘ └────┘ └──────────┘ └───────┘ │
└──────────────────────────────────────────────────┘
```

---

## 2. 技術スタック

### 2.1 フレームワーク・ランタイム

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| フレームワーク | Next.js | 16.2.1 | App Router によるフルスタック開発 |
| 言語 | TypeScript | 5.9.3 | 型安全なコード記述 |
| UI ライブラリ | React | 19.2.4 | コンポーネントベース UI |
| CSS | Tailwind CSS | 4.2.2 | ユーティリティファースト CSS |
| ORM | Prisma | 7.5.0 | データベースアクセス |
| 認証 | NextAuth | 5.0.0-beta.30 | JWT ベースの認証 |
| DB | PostgreSQL | - | リレーショナルデータベース |

### 2.2 主要ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| `@tanstack/react-table` | テーブル表示（ヘッダ・セル・ページネーション） |
| `papaparse` | CSV パース（ブラウザ側） |
| `bcryptjs` | パスワードハッシュ化 |
| `class-variance-authority` | UI コンポーネントのバリアント管理 |
| `clsx` + `tailwind-merge` | CSS クラス結合ユーティリティ |
| `@prisma/adapter-pg` | PostgreSQL ネイティブアダプタ |

---

## 3. 環境構築手順

### 3.1 前提条件
- Node.js 20 以上
- npm
- PostgreSQL データベース（ローカル or Neon DB 等のクラウドサービス）
- Git

### 3.2 プロジェクト作成

```bash
# Next.js プロジェクト作成
npx create-next-app@latest spread --typescript --tailwind --eslint --app --src-dir

cd spread
```

### 3.3 依存パッケージインストール

```bash
# 本体依存
npm install next-auth@beta @prisma/client @prisma/adapter-pg pg \
  @tanstack/react-table papaparse bcryptjs \
  class-variance-authority clsx tailwind-merge lucide-react dotenv

# 開発用依存
npm install -D prisma tsx @types/bcryptjs @types/papaparse @types/pg

# PostCSS プラグイン（Tailwind CSS v4）
npm install @tailwindcss/postcss autoprefixer
```

### 3.4 環境変数設定

`.env` ファイルを作成：

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.5 package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma db push && next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx prisma db seed",
    "db:studio": "npx prisma studio"
  },
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### 3.6 PostCSS 設定

`postcss.config.mjs`:
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 3.7 グローバル CSS

`src/app/globals.css`:
```css
@import "tailwindcss";
```

### 3.8 TypeScript パスエイリアス

`tsconfig.json` の `compilerOptions` に以下を設定：
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

---

## 4. ディレクトリ構成

```
spread/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ定義
│   └── seed.ts                # 初期データ投入スクリプト
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # / → /sheets リダイレクト
│   │   ├── globals.css        # グローバル CSS
│   │   ├── error.tsx          # グローバルエラーバウンダリ
│   │   ├── login/
│   │   │   └── page.tsx       # ログインページ
│   │   ├── sheets/
│   │   │   ├── layout.tsx     # シート系共通レイアウト
│   │   │   ├── page.tsx       # シート一覧
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # CSV インポート
│   │   │   └── [sheetId]/
│   │   │       ├── page.tsx   # シート詳細（スプレッドシート表示）
│   │   │       └── requests/
│   │   │           ├── page.tsx      # 変更リクエスト一覧
│   │   │           └── [requestId]/
│   │   │               └── page.tsx  # 変更リクエスト詳細
│   │   ├── admin/
│   │   │   ├── layout.tsx     # 管理系共通レイアウト
│   │   │   └── users/
│   │   │       ├── page.tsx   # ユーザー管理
│   │   │       └── [userId]/
│   │   │           └── edit/
│   │   │               └── page.tsx  # ユーザー編集
│   │   ├── profile/
│   │   │   ├── layout.tsx     # プロフィール系共通レイアウト
│   │   │   └── password/
│   │   │       └── page.tsx   # パスワード変更
│   │   └── api/               # API ルート
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # NextAuth ハンドラ
│   │       ├── users/
│   │       │   └── route.ts       # ユーザー一覧（行管理者割り当て用）
│   │       ├── sheets/
│   │       │   ├── route.ts       # シート CRUD
│   │       │   └── [sheetId]/
│   │       │       ├── route.ts           # シート詳細・削除
│   │       │       ├── rows/
│   │       │       │   ├── route.ts       # 行データ取得
│   │       │       │   └── manager/
│   │       │       │       └── route.ts   # 行管理者割り当て
│   │       │       └── locked-columns/
│   │       │           └── route.ts       # カラムロック設定
│   │       ├── change-requests/
│   │       │   ├── route.ts               # 変更リクエスト一覧・作成
│   │       │   └── [requestId]/
│   │       │       ├── route.ts           # 変更リクエスト詳細
│   │       │       ├── approve/
│   │       │       │   └── route.ts       # 承認
│   │       │       ├── reject/
│   │       │       │   └── route.ts       # 却下
│   │       │       └── withdraw/
│   │       │           └── route.ts       # 取り下げ
│   │       ├── admin/
│   │       │   └── users/
│   │       │       ├── route.ts           # ユーザー管理 CRUD
│   │       │       └── [userId]/
│   │       │           └── route.ts       # ユーザー個別操作
│   │       └── profile/
│   │           └── password/
│   │               └── route.ts           # パスワード変更
│   ├── components/
│   │   ├── providers.tsx      # SessionProvider ラッパー
│   │   ├── layout/
│   │   │   └── header.tsx     # 共通ヘッダー
│   │   ├── sheets/
│   │   │   ├── spreadsheet-editor.tsx    # スプレッドシートエディタ（メイン）
│   │   │   └── column-lock-settings.tsx  # カラムロック設定パネル
│   │   ├── change-requests/
│   │   │   └── review-actions.tsx        # 承認・却下・取り下げ UI
│   │   └── ui/               # 汎用 UI コンポーネント
│   │       ├── button.tsx
│   │       ├── badge.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   ├── hooks/
│   │   └── use-change-tracking.ts  # セル変更追跡カスタムフック
│   ├── lib/
│   │   ├── auth.ts            # NextAuth 設定（本体）
│   │   ├── auth.config.ts     # NextAuth 設定（Edge 互換）
│   │   ├── prisma.ts          # Prisma クライアント初期化
│   │   ├── permissions.ts     # 権限判定ユーティリティ
│   │   └── utils.ts           # CSS クラスユーティリティ
│   ├── types/
│   │   └── index.ts           # 型定義
│   └── middleware.ts          # 認証ミドルウェア
├── .env                       # 環境変数
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 5. データベース設計

### 5.1 ER 図

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │     │    Sheet     │     │     Row      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │◄──┐ │ id (PK)      │◄──┐ │ id (PK)      │
│ email (UQ)   │   │ │ name         │   │ │ sheetId (FK) │──┐
│ name         │   ├─│ createdBy(FK)│   │ │ rowIndex     │  │
│ hashedPasswd │   │ │ columns (JSON)│   │ │ data (JSON)  │  │
│ role (enum)  │   │ │ lockedCols   │   │ │ rowMgrId(FK) │──┤
│ createdAt    │   │ │   (JSON)     │   │ │ createdAt    │  │
│ updatedAt    │   │ │ createdAt    │   │ │ updatedAt    │  │
└──────────────┘   │ │ updatedAt    │   │ └──────────────┘  │
       │           │ └──────────────┘   │        │          │
       │ 1:N       │                    │ 1:N    │          │
       ▼           │                    │        ▼          │
┌──────────────┐   │                    │ ┌──────────────┐  │
│ChangeRequest │   │                    │ │  ChangeCell  │  │
├──────────────┤   │                    │ ├──────────────┤  │
│ id (PK)      │   │                    │ │ id (PK)      │  │
│ sheetId (FK) │───┘                    │ │ changeReqId  │  │
│ reqerId (FK) │                        │ │   (FK)       │  │
│ reviewId(FK) │                        │ │ rowId (FK)   │──┘
│ status (enum)│                        │ │ columnKey    │
│ comment      │◄───────────────────────┘ │ oldValue     │
│ reviewComment│          1:N             │ newValue     │
│ createdAt    │──────────────────────────│              │
│ updatedAt    │                          └──────────────┘
└──────────────┘
```

### 5.2 Prisma スキーマ

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
}

// ============================================================
// Authentication & Users
// ============================================================
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  hashedPassword String   @map("hashed_password")
  role           Role     @default(EDITOR)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  sheets           Sheet[]
  changeRequests   ChangeRequest[] @relation("requester")
  reviewedRequests ChangeRequest[] @relation("reviewer")
  managedRows      Row[]           @relation("rowManager")

  @@map("spread_users")
}

enum Role {
  EDITOR
  APPROVER
  ADMIN
}

// ============================================================
// Sheet (imported CSV dataset)
// ============================================================
model Sheet {
  id        String   @id @default(cuid())
  name          String
  columns       Json
  lockedColumns Json     @default("[]") @map("locked_columns")
  createdBy     String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  creator        User            @relation(fields: [createdBy], references: [id])
  rows           Row[]
  changeRequests ChangeRequest[]

  @@map("spread_sheets")
}

// ============================================================
// Row (one row of data, stored as JSONB)
// ============================================================
model Row {
  id           String   @id @default(cuid())
  sheetId      String   @map("sheet_id")
  rowIndex     Int      @map("row_index")
  data         Json
  rowManagerId String?  @map("row_manager_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sheet       Sheet        @relation(fields: [sheetId], references: [id], onDelete: Cascade)
  rowManager  User?        @relation("rowManager", fields: [rowManagerId], references: [id])
  changeCells ChangeCell[]

  @@unique([sheetId, rowIndex])
  @@map("spread_rows")
}

// ============================================================
// Change Request (approval unit)
// ============================================================
model ChangeRequest {
  id            String              @id @default(cuid())
  sheetId       String              @map("sheet_id")
  requesterId   String              @map("requester_id")
  reviewerId    String?             @map("reviewer_id")
  status        ChangeRequestStatus @default(PENDING)
  comment       String?
  reviewComment String?             @map("review_comment")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")

  sheet     Sheet        @relation(fields: [sheetId], references: [id], onDelete: Cascade)
  requester User         @relation("requester", fields: [requesterId], references: [id])
  reviewer  User?        @relation("reviewer", fields: [reviewerId], references: [id])
  cells     ChangeCell[]

  @@map("spread_change_requests")
}

enum ChangeRequestStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}

// ============================================================
// Change Cell (cell-level diff)
// ============================================================
model ChangeCell {
  id              String @id @default(cuid())
  changeRequestId String @map("change_request_id")
  rowId           String @map("row_id")
  columnKey       String @map("column_key")
  oldValue        String? @map("old_value")
  newValue        String? @map("new_value")

  changeRequest ChangeRequest @relation(fields: [changeRequestId], references: [id], onDelete: Cascade)
  row           Row           @relation(fields: [rowId], references: [id], onDelete: Cascade)

  @@map("spread_change_cells")
}
```

### 5.3 設計のポイント

| 設計判断 | 理由 |
|---------|------|
| `columns` を JSON 配列で格納 | CSV のカラム名は動的。リレーションテーブルにすると過度に複雑になる |
| `data` を JSON (JSONB) で格納 | 各行のデータはカラム名をキーとした key-value。柔軟な構造に対応 |
| `lockedColumns` を JSON で格納 | ロック対象カラム名のリスト。配列で十分 |
| `ChangeCell` でセル単位の差分を記録 | 行全体の差分ではなくセル単位で追跡。競合検出が可能 |
| `@@map` でテーブル名を明示 | `spread_` プレフィックスで他システムとの衝突回避 |
| Cascade Delete | Sheet 削除時に Row, ChangeRequest も連鎖削除 |

### 5.4 シードデータ

`prisma/seed.ts` で 3 ユーザーを初期作成：

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者",
      hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "approver@example.com" },
    update: {},
    create: {
      email: "approver@example.com",
      name: "承認者",
      hashedPassword: await hash("approver123", 12),
      role: "APPROVER",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@example.com" },
    update: {},
    create: {
      email: "editor@example.com",
      name: "編集者",
      hashedPassword: await hash("editor123", 12),
      role: "EDITOR",
    },
  });

  console.log("Seed completed: 3 users created (admin, approver, editor)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

### 5.5 データベースセットアップ

```bash
# マイグレーション作成・適用
npx prisma migrate dev --name init

# シードデータ投入
npm run db:seed

# Prisma Studio（GUI でデータ確認）
npm run db:studio
```

---

## 6. 認証・認可設計

### 6.1 認証方式
- **NextAuth v5** (Beta) + **Credentials Provider**
- **セッション戦略**: JWT（サーバーレス環境対応）
- **パスワード**: bcryptjs でハッシュ化（salt rounds: 12）

### 6.2 認証設定の分割構造

NextAuth v5 では、Edge Runtime（Middleware）で動作する設定と、Node.js Runtime（API Route）で動作する設定を分離する必要がある。

#### Edge 互換設定: `src/lib/auth.config.ts`

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // middleware では空
};
```

**ポイント**: JWT コールバックでユーザー ID とロールをトークンに含め、session コールバックでクライアント側に公開する。

#### 本体設定: `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.hashedPassword
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
```

#### NextAuth API ルート: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### 6.3 型拡張: `src/types/index.ts`

NextAuth のデフォルト型にロール情報を追加：

```typescript
import type { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

export type SheetColumn = string;
export type RowData = Record<string, string>;

export interface CellChange {
  rowId: string;
  columnKey: string;
  oldValue: string | null;
  newValue: string | null;
}
```

### 6.4 ミドルウェア: `src/middleware.ts`

```typescript
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

  // NextAuth API は常に通す
  if (isAuthApi) return NextResponse.next();

  // 未認証 → ログインページへリダイレクト
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 認証済みでログインページアクセス → シート一覧へリダイレクト
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/sheets", req.url));
  }

  // Admin ページの保護
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/sheets", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 6.5 ロール定義

| ロール | 権限 |
|--------|------|
| `ADMIN` | ユーザー管理（CRUD）、全機能アクセス |
| `APPROVER` | シート閲覧・編集（行管理者として）、変更申請 |
| `EDITOR` | シート閲覧・編集（行管理者として）、変更申請 |

> 注: APPROVER と EDITOR の違いは将来拡張用。現時点では同等の権限。承認・却下はロールではなく「シート管理者（シート作成者）」が行う。

---

## 7. 画面設計・ルーティング

### 7.1 画面一覧

| パス | 画面名 | 種別 | アクセス制限 |
|------|--------|------|-------------|
| `/login` | ログイン | Client | 未認証のみ |
| `/` | リダイレクト | Server | → `/sheets` |
| `/sheets` | シート一覧 | Server | 認証必須 |
| `/sheets/new` | CSV インポート | Client | 認証必須 |
| `/sheets/[sheetId]` | シート詳細（エディタ） | Server + Client | 認証必須 |
| `/sheets/[sheetId]/requests` | 変更リクエスト一覧 | Server | 認証必須 |
| `/sheets/[sheetId]/requests/[requestId]` | 変更リクエスト詳細 | Server | 認証必須 |
| `/admin/users` | ユーザー管理 | Client | ADMIN のみ |
| `/admin/users/[userId]/edit` | ユーザー編集 | Client | ADMIN のみ |
| `/profile/password` | パスワード変更 | Client | 認証必須 |

### 7.2 レイアウト構造

```
RootLayout (html, body, globals.css)
├── /login → LoginPage（レイアウトなし、センタリング）
├── /sheets → SheetsLayout (Providers + Header + full-width)
│   ├── /sheets → SheetsPage
│   ├── /sheets/new → NewSheetPage
│   ├── /sheets/[sheetId] → SheetPage + SpreadsheetEditor
│   └── /sheets/[sheetId]/requests → RequestsPage
│       └── /sheets/[sheetId]/requests/[requestId] → RequestDetailPage
├── /admin → AdminLayout (Providers + Header + max-w-7xl)
│   └── /admin/users → UsersPage
│       └── /admin/users/[userId]/edit → UserEditPage
└── /profile → ProfileLayout (Providers + Header + max-w-7xl)
    └── /profile/password → ChangePasswordPage
```

### 7.3 レイアウトの共通パターン

各レイアウトは以下の構造：

```tsx
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

export default function XxxLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="px-4 py-6">{children}</main>
      {/* admin, profile は mx-auto max-w-7xl 追加 */}
    </Providers>
  );
}
```

- `Providers`: NextAuth の `SessionProvider` をラップ
- `Header`: ナビゲーション、ユーザー情報、ロールバッジ、ログアウト

**注意**: sheets レイアウトは `max-w-7xl` を適用しない（テーブルが全画面幅で表示されるように）。

---

## 8. API 設計

### 8.1 API エンドポイント一覧

#### 認証
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth ハンドラ |

#### シート管理
| メソッド | パス | 説明 | 認可 |
|---------|------|------|------|
| GET | `/api/sheets` | シート一覧 | 認証 |
| POST | `/api/sheets` | CSV からシート作成 | 認証 |
| GET | `/api/sheets/[sheetId]` | シート詳細 | 認証 |
| DELETE | `/api/sheets/[sheetId]` | シート削除 | ADMIN |
| GET | `/api/sheets/[sheetId]/rows` | 行データ（ページネーション） | 認証 |
| PATCH | `/api/sheets/[sheetId]/rows/manager` | 行管理者一括割り当て | シート管理者 |
| PATCH | `/api/sheets/[sheetId]/locked-columns` | カラムロック更新 | シート管理者 |

#### 変更リクエスト
| メソッド | パス | 説明 | 認可 |
|---------|------|------|------|
| GET | `/api/change-requests` | 変更リクエスト一覧 | 認証 |
| POST | `/api/change-requests` | 変更リクエスト作成 | 認証 + 行管理者 |
| GET | `/api/change-requests/[requestId]` | 詳細取得 | 認証 |
| POST | `/api/change-requests/[requestId]/approve` | 承認 | シート管理者 |
| POST | `/api/change-requests/[requestId]/reject` | 却下 | シート管理者 |
| POST | `/api/change-requests/[requestId]/withdraw` | 取り下げ | 申請者本人 |

#### ユーザー管理
| メソッド | パス | 説明 | 認可 |
|---------|------|------|------|
| GET | `/api/users` | ユーザー簡易一覧（行管理者用） | 認証 |
| GET | `/api/admin/users` | ユーザー一覧 | ADMIN |
| POST | `/api/admin/users` | ユーザー作成 | ADMIN |
| GET | `/api/admin/users/[userId]` | ユーザー取得 | ADMIN |
| PATCH | `/api/admin/users/[userId]` | ユーザー更新 | ADMIN |
| DELETE | `/api/admin/users/[userId]` | ユーザー削除 | ADMIN |

#### プロフィール
| メソッド | パス | 説明 | 認可 |
|---------|------|------|------|
| PATCH | `/api/profile/password` | パスワード変更 | 認証 |

### 8.2 API 実装パターン

全 API ルートの共通パターン：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function METHOD(req: NextRequest) {
  // 1. 認証チェック
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 認可チェック（必要に応じて）
  // - ロールチェック: session.user.role
  // - シート管理者チェック: sheet.createdBy === session.user.id
  // - 申請者チェック: request.requesterId === session.user.id

  // 3. バリデーション
  // 4. DB 操作
  // 5. レスポンス返却
}
```

### 8.3 重要な API 詳細

#### POST /api/sheets（CSV インポート）

リクエストボディ：
```json
{
  "name": "シート名",
  "columns": ["列1", "列2", "列3"],
  "rows": [
    {"列1": "値1", "列2": "値2", "列3": "値3"},
    ...
  ]
}
```

CSVパースはクライアント側（PapaParse）で行い、パース済みデータをAPIに送信する。

#### GET /api/sheets/[sheetId]/rows（行データ取得）

クエリパラメータ：
- `page`: ページ番号（デフォルト: 1）
- `pageSize`: 1 ページあたりの行数（デフォルト: 50、最大: 100）

レスポンス：
```json
{
  "rows": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 100,
    "totalPages": 2
  },
  "pendingCells": {
    "rowId1": ["columnA", "columnB"],
    "rowId2": ["columnC"]
  }
}
```

`pendingCells` は現在 PENDING 状態の変更リクエストに含まれるセル情報。UI でセルの背景色を青にするために使用。

#### POST /api/change-requests/[requestId]/approve（承認）

トランザクション内で以下を実行：
1. リクエストの存在・ステータス確認
2. シート管理者（作成者）か確認
3. セルを行ごとにグループ化
4. **競合検出**: 各セルの `oldValue` と現在の行データを比較
5. 競合なければ行データに変更を適用
6. ステータスを APPROVED に更新

```
競合検出ロジック:
if (currentRowData[columnKey] !== cell.oldValue) {
  → エラー「競合が検出されました」
}
```

---

## 9. コンポーネント設計

### 9.1 共通 UI コンポーネント

#### Button

`class-variance-authority` でバリアント管理：

| バリアント | 用途 | 外観 |
|-----------|------|------|
| `default` | 主要アクション | 青背景・白文字 |
| `destructive` | 削除・却下 | 赤背景・白文字 |
| `outline` | 副次アクション | 白背景・グレー枠 |
| `ghost` | テーブル内ボタン | 背景なし |
| `link` | リンクスタイル | 青文字・下線 |

サイズ: `default`（h-10）、`sm`（h-9）、`lg`（h-11）、`icon`（h-10 w-10）

#### Badge

ステータス表示用：

| バリアント | 用途 | 色 |
|-----------|------|-----|
| `warning` | 申請中 (PENDING) | 黄色 |
| `success` | 承認済み (APPROVED) | 緑色 |
| `destructive` | 却下 (REJECTED) | 赤色 |
| `secondary` | 取り下げ (WITHDRAWN) | グレー |

#### Input / Label

- Tailwind CSS でスタイル済みの基本フォーム要素
- `forwardRef` 対応
- `cn()` ユーティリティでクラス結合

### 9.2 ヘッダーコンポーネント

```
┌─────────────────────────────────────────────────────┐
│ Spread   シート一覧   ユーザー管理*   名前 [ロール]  │
│                                パスワード変更 ログアウト│
└─────────────────────────────────────────────────────┘
* ADMIN ロールの場合のみ表示
```

### 9.3 SpreadsheetEditor（最重要コンポーネント）

このコンポーネントがシステムの中核。以下の機能を持つ：

#### 状態管理

| State | 型 | 用途 |
|-------|-----|------|
| `rows` | `RowData[]` | 表示中の行データ |
| `pagination` | `Pagination` | ページネーション情報 |
| `pendingCells` | `Record<string, string[]>` | PENDING 変更セルマップ |
| `lockedColumns` | `string[]` | ロックされたカラム名 |
| `users` | `UserInfo[]` | 行管理者割り当て用ユーザー一覧 |
| `submitComment` | `string` | 承認申請コメント |
| `showSubmitForm` | `boolean` | 申請フォーム表示状態 |
| `pendingManagerAssignments` | `Map` | 未保存の行管理者変更 |

#### セルの背景色ルール

| 優先度 | 条件 | 色 | CSS クラス |
|--------|------|-----|-----------|
| 1 (最高) | 編集中（未送信の変更あり） | 黄色 | `bg-yellow-100` |
| 2 | 承認申請中（PENDING） | 青色 | `bg-blue-100` |
| 3 | カラムロック | グレー | `bg-gray-100` |
| 4 | 編集権限なし（行管理者でない） | 薄いグレー | `bg-gray-50` |
| 5 (最低) | 通常 | なし | - |

#### EditableCell サブコンポーネント

- ダブルクリックで編集モードに遷移
- Enter で確定、Escape でキャンセル
- blur（フォーカスアウト）でも確定
- 編集不可セルは `cursor-default text-gray-500` で表示
- ツールチップでロック理由を表示

#### 編集ワークフロー

```
1. ダブルクリック → 入力フィールド表示
2. 値変更 → trackChange() で変更追跡
3. 「承認申請」ボタン → コメント入力フォーム表示
4. 「申請を送信」 → POST /api/change-requests
5. 成功 → 変更クリア、行データ再取得（pending セル更新）
```

### 9.4 変更追跡カスタムフック: `useChangeTracking`

```typescript
// CellKey = `${rowId}:${columnKey}` の形式で Map に格納
// 元の値に戻した場合は自動的に変更を削除

const {
  changes,      // Map<CellKey, CellChange>
  changeList,   // CellChange[] 配列
  changeCount,  // 変更件数
  trackChange,  // (rowId, columnKey, oldValue, newValue) => void
  clearChanges, // () => void
  isChanged,    // (rowId, columnKey) => boolean
} = useChangeTracking();
```

### 9.5 ReviewActions コンポーネント

変更リクエスト詳細ページ下部に表示されるアクションパネル。

表示条件：
- `canReview`: シート管理者 かつ ステータスが PENDING → 「承認する」「却下する」ボタン
- `isRequester`: 申請者本人 かつ ステータスが PENDING → 「取り下げ」ボタン

### 9.6 ColumnLockSettings コンポーネント

カラム名をトグルボタンとして表示。クリックでロック/アンロックを切り替え。変更がある場合のみ「保存」ボタンを表示。

---

## 10. 権限システム設計

### 10.1 権限の 3 層構造

```
┌─────────────────────────────────────────┐
│  第 1 層: アプリケーションロール（User.role）   │
│  → ADMIN / APPROVER / EDITOR              │
│  → ユーザー管理、Admin ページアクセス制御     │
├─────────────────────────────────────────┤
│  第 2 層: シート管理者（Sheet.createdBy）     │
│  → シート作成者 = シート管理者                │
│  → 変更リクエストの承認/却下                  │
│  → カラムロック設定                          │
│  → 行管理者割り当て（手動モード時）            │
├─────────────────────────────────────────┤
│  第 3 層: 行管理者（Row レベル）              │
│  → 自動検出モード or 手動割り当てモード        │
│  → セルレベルの編集可否を決定                 │
└─────────────────────────────────────────┘
```

### 10.2 行管理者の 2 つのモード

#### 自動検出モード

CSV に「行管理者」を含むカラム名がある場合に自動で有効化。

```
例: カラム名「第一行管理者」「第二行管理者」

行データ:
| 第一行管理者 | 第二行管理者 | 名前 | 住所 |
| tanaka      | suzuki      | ...  | ...  |

→ tanaka@example.com のユーザーはこの行を編集可能
→ suzuki@example.com のユーザーもこの行を編集可能
```

マッチングルール: メールアドレスの `@` より前の部分 とカラム値を比較。

#### 手動割り当てモード

「行管理者」カラムがない場合に使用。シート管理者がドロップダウンで行ごとにユーザーを割り当て。

### 10.3 セル編集可否判定: `canEditCell()`

```
判定フロー:
1. lockedColumns に含まれる? → 編集不可（理由: "locked"）
2. 行管理者カラム自体?     → 編集不可（理由: "row_manager_column"）
3. 行管理者でない?         → 編集不可（理由: "not_row_manager"）
4. 上記いずれでもない       → 編集可能
```

### 10.4 権限ユーティリティ: `src/lib/permissions.ts`

```typescript
// 行管理者カラムを検出
function findRowManagerColumns(columns: string[]): string[]

// メール prefix を取得
function getEmailPrefix(email: string): string

// 行管理者判定
function isRowManager(params: { ... }): boolean

// セル編集可否判定
function canEditCell(params: { ... }): { editable: boolean; reason?: string }
```

---

## 11. 業務フロー設計

### 11.1 CSV インポートフロー

```
ユーザー           ブラウザ               サーバー            DB
  │                  │                     │                 │
  │ CSV ファイル選択 ──│                     │                 │
  │                  │ PapaParse でパース    │                 │
  │                  │ プレビュー表示       │                 │
  │ シート名入力     ──│                     │                 │
  │ インポート実行   ──│                     │                 │
  │                  │ POST /api/sheets  ──│                 │
  │                  │                     │ Sheet 作成    ──│
  │                  │                     │ Row 一括作成  ──│
  │                  │ ← sheet.id          │                 │
  │ シート詳細へ遷移 ←│                     │                 │
```

### 11.2 データ編集・変更申請フロー

```
ユーザー           ブラウザ               サーバー            DB
  │                  │                     │                 │
  │ セルダブルクリック──│                     │                 │
  │                  │ EditableCell 編集    │                 │
  │ 値を入力         ──│                     │                 │
  │                  │ trackChange()       │                 │
  │                  │ セル黄色に変化       │                 │
  │ 「承認申請」     ──│                     │                 │
  │                  │ コメント入力フォーム  │                 │
  │ コメント入力     ──│                     │                 │
  │ 「申請を送信」   ──│                     │                 │
  │                  │ POST /api/          │                 │
  │                  │   change-requests ──│                 │
  │                  │                     │ 権限チェック     │
  │                  │                     │ ロック列チェック  │
  │                  │                     │ ChangeReq 作成──│
  │                  │                     │ ChangeCell 作成─│
  │                  │ ← 201 Created       │                 │
  │                  │ 行データ再取得       │                 │
  │ セル青色に変化   ←│                     │                 │
```

### 11.3 承認フロー

```
シート管理者        ブラウザ               サーバー            DB
  │                  │                     │                 │
  │ リクエスト詳細   ──│                     │                 │
  │                  │ 変更前/後 比較表示   │                 │
  │ 「承認する」     ──│                     │                 │
  │ コメント入力     ──│                     │                 │
  │ 「承認を確定」   ──│                     │                 │
  │                  │ POST approve      ──│                 │
  │                  │                     │ ← Transaction ─ │
  │                  │                     │  1. 競合チェック │
  │                  │                     │  2. 行データ更新 │
  │                  │                     │  3. status=APPROVED
  │                  │ ← 200 OK            │                 │
  │ リクエスト一覧へ ←│                     │                 │
```

### 11.4 取り下げフロー

```
申請者             ブラウザ               サーバー            DB
  │                  │                     │                 │
  │ リクエスト詳細   ──│                     │                 │
  │ 「取り下げ」     ──│                     │                 │
  │                  │ confirm ダイアログ   │                 │
  │ OK              ──│                     │                 │
  │                  │ POST withdraw     ──│                 │
  │                  │                     │ 申請者チェック   │
  │                  │                     │ status=WITHDRAWN─│
  │                  │ ← 200 OK            │                 │
  │ リクエスト一覧へ ←│                     │                 │
```

### 11.5 変更リクエストの状態遷移

```
                    ┌──── 申請者が取り下げ ────┐
                    │                         ▼
作成 → [PENDING] ──┼──── 管理者が承認 ──→ [APPROVED]
                    │
                    └──── 管理者が却下 ──→ [REJECTED]
                    │
                    └──── 申請者が取り下げ → [WITHDRAWN]
```

---

## 12. ステップバイステップ実装ガイド

このセクションでは、ゼロからシステムを構築する順序を示す。

### Phase 1: 基盤構築（認証・DB・基本構造）

#### Step 1.1: プロジェクト作成と依存インストール
→ 「3. 環境構築手順」参照

#### Step 1.2: Prisma スキーマ作成
→ `prisma/schema.prisma` を作成（「5.2 Prisma スキーマ」参照）

#### Step 1.3: Prisma クライアント初期化

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function cleanConnectionString(url: string): string {
  return url
    .replace(/[?&]channel_binding=[^&]*/gi, "")
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/\?$/, "");
}

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: cleanConnectionString(process.env.DATABASE_URL!),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**重要**: Neon DB 等のクラウド PostgreSQL を使用する場合、接続文字列から `sslmode` パラメータを除去する必要がある（pg ライブラリが `ssl` オブジェクトと文字列を混同するバグ回避）。

#### Step 1.4: ユーティリティ作成

`src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Step 1.5: UI コンポーネント作成
→ Button, Input, Label, Badge（「9.1 共通 UI コンポーネント」参照）

#### Step 1.6: 型定義
→ `src/types/index.ts`（「6.3 型拡張」参照）

#### Step 1.7: NextAuth 設定
→ `auth.config.ts`, `auth.ts`, API ルート, ミドルウェア（「6. 認証・認可設計」参照）

#### Step 1.8: Providers / Header / レイアウト
→ `providers.tsx`, `header.tsx`, 各 `layout.tsx`（「7.3 レイアウトの共通パターン」参照）

#### Step 1.9: ログインページ
→ 「7.1 画面一覧」参照。メール + パスワードフォーム、`signIn("credentials", ...)` を使用。

#### Step 1.10: シードデータ作成・DB 初期化

```bash
npx prisma migrate dev --name init
npm run db:seed
```

#### Step 1.11: 動作確認
- `npm run dev` で起動
- `http://localhost:3000` にアクセス → ログインページへリダイレクト
- `admin@example.com` / `admin123` でログイン → `/sheets` にリダイレクト

---

### Phase 2: シート管理（CSV インポート・表示）

#### Step 2.1: シート API 作成
- `GET /api/sheets` - 一覧取得
- `POST /api/sheets` - CSV データからシート作成
- `GET /api/sheets/[sheetId]` - 詳細取得
- `DELETE /api/sheets/[sheetId]` - 削除（ADMIN）

#### Step 2.2: 行データ API 作成
- `GET /api/sheets/[sheetId]/rows` - ページネーション付き行取得

#### Step 2.3: シート一覧ページ
- SSR（Server Component）で Prisma 直接クエリ
- シート名、カラム数、行数、作成者、作成日を表示
- 「CSV インポート」ボタン

#### Step 2.4: CSV インポートページ
- `"use client"` のクライアントコンポーネント
- PapaParse でブラウザ側パース
- プレビュー表示（先頭 10 行）
- シート名入力
- API に送信

#### Step 2.5: スプレッドシート表示
- `useChangeTracking` フック作成
- `SpreadsheetEditor` コンポーネント作成
  - TanStack Table によるテーブル描画
  - ページネーション（50 行/ページ）
  - セル改行なし（`whitespace-nowrap`）

#### Step 2.6: 動作確認
- CSV ファイルをインポート
- テーブル表示・ページネーション動作確認

---

### Phase 3: 権限システム

#### Step 3.1: 権限判定ユーティリティ作成
→ `src/lib/permissions.ts`（「10.4 権限ユーティリティ」参照）

#### Step 3.2: EditableCell にセル編集可否を組み込み
- `canEditCell()` の結果に基づき、背景色・ダブルクリック可否・ツールチップを制御

#### Step 3.3: カラムロック API
- `PATCH /api/sheets/[sheetId]/locked-columns`

#### Step 3.4: カラムロック UI
- `ColumnLockSettings` コンポーネント

#### Step 3.5: 行管理者割り当て API
- `PATCH /api/sheets/[sheetId]/rows/manager`

#### Step 3.6: 行管理者割り当て UI
- `RowManagerSelect` サブコンポーネント
- 自動検出モード / 手動割り当てモードの切り替え

#### Step 3.7: 動作確認
- カラムロック → セルが灰色、編集不可
- 行管理者割り当て → 権限なしセルが薄い灰色

---

### Phase 4: 変更リクエスト（承認ワークフロー）

#### Step 4.1: 変更リクエスト API 作成
- `POST /api/change-requests` - 作成（権限チェック込み）
- `GET /api/change-requests` - 一覧
- `GET /api/change-requests/[requestId]` - 詳細

#### Step 4.2: 承認・却下・取り下げ API
- `POST /api/change-requests/[requestId]/approve` - 承認（トランザクション + 競合検出）
- `POST /api/change-requests/[requestId]/reject` - 却下
- `POST /api/change-requests/[requestId]/withdraw` - 取り下げ

#### Step 4.3: 申請フォーム UI
- SpreadsheetEditor に「承認申請」ボタン
- コメント入力フォーム

#### Step 4.4: PENDING セルの青色表示
- rows API に `pendingCells` を追加
- EditableCell に `isPending` プロップ

#### Step 4.5: 変更リクエスト一覧ページ
- ステータスバッジ、申請者、セル数、日付表示

#### Step 4.6: 変更リクエスト詳細ページ
- メタ情報（ステータス、申請者、日付、コメント）
- セル単位の差分テーブル（変更前/変更後）
- 行データの比較表示（全カラムで変更前/後を横並び）

#### Step 4.7: ReviewActions コンポーネント
- 承認ボタン + コメント入力
- 却下ボタン + 理由入力
- 取り下げボタン + 確認ダイアログ

#### Step 4.8: セル背景色凡例
- 編集中（黄）、申請中（青）、ロック（灰）、権限なし（薄灰）

#### Step 4.9: 動作確認
- セル編集 → 承認申請 → 青色表示 → 承認 → データ反映
- 却下パターン、取り下げパターン

---

### Phase 5: ユーザー管理

#### Step 5.1: 管理者用ユーザー API
- CRUD（「8.1 API エンドポイント一覧」参照）

#### Step 5.2: ユーザー一覧ページ（`/admin/users`）
- テーブル表示、作成フォーム、削除機能

#### Step 5.3: ユーザー編集ページ（`/admin/users/[userId]/edit`）
- 名前、ロール変更、パスワードリセット

#### Step 5.4: パスワード変更 API（`/api/profile/password`）
- 現在のパスワード照合 → 新パスワードハッシュ化

#### Step 5.5: パスワード変更ページ（`/profile/password`）
- 現在のパスワード、新パスワード、確認入力

#### Step 5.6: ヘッダーに「パスワード変更」リンク追加

---

### Phase 6: 仕上げ

#### Step 6.1: エラーバウンダリ
- `src/app/error.tsx`

#### Step 6.2: ルートページリダイレクト
- `/` → `/sheets` にリダイレクト

#### Step 6.3: 全体テスト
- 各ロール（ADMIN/APPROVER/EDITOR）でログインして操作確認
- 権限制御の動作確認（ミドルウェア、API、UI）
- 変更ワークフロー全フロー（申請→承認/却下/取り下げ）
- 競合検出の確認

---

## 13. デプロイ手順

### 13.1 Vercel デプロイ

1. GitHub リポジトリにプッシュ
2. Vercel でプロジェクトをインポート
3. 環境変数を設定:
   - `DATABASE_URL`: PostgreSQL 接続文字列
   - `NEXTAUTH_SECRET`: ランダムな秘密鍵
   - `NEXTAUTH_URL`: デプロイ先の URL
4. `build` コマンド: `prisma generate && prisma db push && next build`
   - `prisma db push` がビルド時にスキーマを DB に適用

### 13.2 DB 初期化（初回のみ）

Vercel デプロイ後、ローカルから seed を実行:
```bash
npx prisma db seed
```

またはVercel の Function Logs から seed の実行を確認。

---

## 14. テストアカウント

| ロール | メールアドレス | パスワード | 用途 |
|--------|---------------|-----------|------|
| ADMIN | admin@example.com | admin123 | ユーザー管理、全機能 |
| APPROVER | approver@example.com | approver123 | シート閲覧・編集 |
| EDITOR | editor@example.com | editor123 | シート閲覧・編集 |

---

## 付録 A: Prisma クライアント初期化の注意点

### グローバルインスタンス管理

開発環境でのホットリロード時に Prisma クライアントが重複作成されるのを防ぐため、`globalThis` にキャッシュする：

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Neon DB 接続文字列のクリーニング

`pg` ライブラリが `sslmode` パラメータを SSL オブジェクトに変換する際のバグを回避：

```typescript
function cleanConnectionString(url: string): string {
  return url
    .replace(/[?&]channel_binding=[^&]*/gi, "")
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/\?$/, "");
}
```

## 付録 B: CSS クラスユーティリティ

`cn()` 関数は `clsx` と `tailwind-merge` を組み合わせ、Tailwind CSS のクラス衝突を自動解決：

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用例:
cn("px-4 py-2", isActive && "bg-blue-600", className)
// → 重複するクラスは後のもので上書きされる
```

## 付録 C: SessionProvider の配置

Next.js App Router では、`SessionProvider` をクライアントコンポーネントでラップし、各レイアウトで使用する：

```typescript
// src/components/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

各レイアウト（sheets, admin, profile）で `<Providers>` でラップすることで、配下の全ページで `useSession()` が使用可能になる。
