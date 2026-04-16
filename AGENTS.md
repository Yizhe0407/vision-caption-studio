# Vision Caption Studio Agent Guide

## Product Goal
Build an image-caption platform that supports login, batch upload, async generation, and model/cost observability.

## Core User Flow
1. User logs in.
2. User lands on **Dashboard Home**.
3. User navigates to:
   - **Generate**: upload images and enqueue caption/tag generation.
   - **Data List**: inspect job status and generated results.
   - **API Settings**: set preferred provider/model defaults on frontend.

## Frontend Structure
- `app/login/page.tsx`: login/register UI.
- `app/dashboard/layout.tsx`: protected shell wrapper.
- `app/dashboard/page.tsx`: dashboard home navigation.
- `app/dashboard/generate/page.tsx`: batch upload + queue status + result preview.
- `app/dashboard/images/page.tsx`: searchable data list and detail.
- `app/dashboard/settings/api/page.tsx`: provider/model preference page.

## Backend MVC + DI
- **Controllers**: input parsing/validation.
- **Services**: domain logic.
- **Repositories**: Prisma data access.
- **Infrastructure**: JWT, MinIO, BullMQ, AI providers.
- **DI Container**: `src/di/container.ts` wires all dependencies.

## AI Provider Strategy
- Provider abstraction interface + factory switch.
- Supported: OpenAI, OpenRouter, Gemini, Claude.
- Prompt comes from DB (`prompt_templates`), not hardcoded.
- Per-request usage stores tokens + estimated cost.

## Data Model Highlights
- `images`: hash, metadata JSON, storage key.
- `captions`: generated text + model/prompt linkage.
- `tags` + `image_tags`: many-to-many tagging.
- `ai_requests`: provider/model/tokens/cost/error.
- `jobs`: queue lifecycle tracking.
- `prompt_templates`: versioned prompts, **scoped per user** (`userId` FK). Each user manages their own independent set. A default template is created automatically on registration. All CRUD operations are restricted to the owning user.

## UX Rules
- Keep style Notion-like: calm, minimal, readable.
- Use `shadcn/ui` components and `lucide-react` icons.
- Show humanized errors with `react-hot-toast`.
- Prefer clear, actionable Traditional Chinese copy.

## Environment & Ops
- Docker Compose runs web + MySQL + Redis + MinIO.
- Env variables in `.env` / `.env.example`.
- JWT secrets and model API keys must be configured via env.

## Quality Gates
- Keep strict TypeScript.
- Preserve MVC boundaries (no business logic in routes/pages).
- Run:
  - `pnpm lint`
  - `pnpm build`
- Avoid breaking existing auth/upload/queue flows.
