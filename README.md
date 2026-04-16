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

2. 啟動服務（Next.js / MySQL / Redis / MinIO）：

```bash
docker compose up -d --build
```

3. 生成 Prisma Client、執行 migration、seed prompt templates：

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
- 目前生成流程採單一 Prompt（同時產生 description + tags JSON），不再拆成 caption/tag 兩段 Prompt。
- 可在 API 設定頁選擇「預設 Prompt Template」，後續生成會優先使用該模板。
- Prompt Template 頁支援新增版本與刪除，且刪除時會強制保留至少一個模板。
- 生成頁不再手動選 provider，會直接使用 API 設定頁目前選定的 provider。
- 系統第一位註冊者會自動成為 `ADMIN`，可在 `/dashboard/admin/users` 管理所有使用者角色。
- Docker Compose 會同時啟動 `web + worker`；`worker` 會消化 BullMQ 佇列，避免任務卡在 `QUEUED`。
- `web` 與 `worker` 都已掛載專案目錄與 polling 設定，支援 dev 即時渲染。
