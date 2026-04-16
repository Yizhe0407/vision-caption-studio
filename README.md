# Vision Caption Studio

基於 Next.js 16 的單一專案，採嚴格 MVC 分層，支援：

- JWT 登入機制
- 使用者角色（USER / ADMIN）與管理員權限
- 批次圖片上傳（MinIO）
- Redis + BullMQ 異步處理
- 多模型 Provider（OpenAI / OpenRouter / Gemini / Claude）
- PromptTemplates 資料庫版本化管理
- Token 與成本追蹤
- 圖片 Hash 追蹤、Metadata JSON、Tags 多對多關聯

## 技術架構

- **Controller**: `src/controllers`
- **Service**: `src/services`
- **Repository(Model Data Access)**: `src/repositories`
- **Infrastructure**: `src/infrastructure`
- **DI Container**: `src/di/container.ts`
- **ORM**: Prisma + MySQL (`prisma/schema.prisma`)
- **UI**: App Router + shadcn-style 元件 + lucide-react

## 環境設定

1. 複製環境變數：

```bash
cp .env.example .env
```

2. 啟動 **開發環境**（Next.js dev / MySQL / Redis / MinIO）：

```bash
pnpm docker:dev:up
```

3. 停止開發環境：

```bash
pnpm docker:dev:down
```

4. 啟動 **正式環境**（Next.js start / MySQL / Redis / MinIO）：

```bash
pnpm docker:prod:up
```

5. 停止正式環境：

```bash
pnpm docker:prod:down
```

6. 生成 Prisma Client、執行 migration、seed prompt templates（非 Docker 流程時使用）：

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
```

## 本地開發

開啟 web：

```bash
pnpm dev
```

開啟 worker（另一個終端）：

```bash
pnpm worker
```

## 主要 API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/users`
- `PATCH /api/admin/users`
- `POST /api/upload/batch`
- `GET /api/jobs`
- `GET /api/images/:id`
- `PATCH /api/images/:id`
- `DELETE /api/images/:id`
- `GET /api/images/:id/file`
- `GET /api/settings/api-keys`
- `PUT /api/settings/api-keys`
- `GET /api/prompt-templates`
- `PATCH /api/prompt-templates/:id`

## 補充說明

- 雲端模型 API Key 由前端 **API 設定頁** 管理（登入後 `/dashboard/settings/api`），並以 AES-GCM 加密後存入 MySQL。
- Prompt Template 提供獨立頁面（`/dashboard/prompt-templates`）可直接前端編輯。
- **Prompt Template 為每位使用者獨立管理**：每位使用者只能看到並編輯自己的模板，註冊時會自動建立一份預設模板。
- 目前生成流程採單一 Prompt（同時產生 description + tags JSON），不再拆成 caption/tag 兩段 Prompt。
- 可在 API 設定頁選擇「預設 Prompt Template」，後續生成會優先使用該模板（限定為自己擁有的模板）。
- Prompt Template 頁支援新增版本與刪除，且刪除時會強制保留至少一個模板（每位使用者各自計算）。
- 生成頁不再手動選 provider，會直接使用 API 設定頁目前選定的 provider。
- 系統第一位註冊者會自動成為 `ADMIN`，可在 `/dashboard/admin/users` 管理所有使用者角色。
- Docker Compose 會同時啟動 `web + worker`；`worker` 會消化 BullMQ 佇列，避免任務卡在 `QUEUED`。
- `web` 與 `worker` 都已掛載專案目錄與 polling 設定，支援 dev 即時渲染。
- `docker-compose.dev.yml` 專供開發；`docker-compose.prod.yml` 專供正式環境。
