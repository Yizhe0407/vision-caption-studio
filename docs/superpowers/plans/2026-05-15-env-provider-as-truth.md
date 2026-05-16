# ENV Provider As Single Source of Truth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove per-user `preferredProvider` from the DB so `DEFAULT_AI_PROVIDER` in `.env` is the only setting that controls which AI provider is used for all jobs.

**Architecture:** Drop the `preferredProvider` column from the `User` model, remove all code that reads or writes it, and have `ai-generation.service.ts` and `image.controller.ts` read `env.DEFAULT_AI_PROVIDER` directly. Hide the API Settings page from the navigation.

**Tech Stack:** Prisma (MySQL), Next.js, TypeScript

---

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Remove `preferredProvider` field from `User` model |
| `src/repositories/user.repository.ts` | Remove `preferredProvider` from `createWithAutoRole`, drop `updatePreferredProvider` and `updatePreferences` methods |
| `src/services/auth.service.ts` | Remove `env.DEFAULT_AI_PROVIDER` arg passed to `createWithAutoRole` |
| `src/services/ai-generation.service.ts` | Replace `user.preferredProvider ?? env.DEFAULT_AI_PROVIDER` with `env.DEFAULT_AI_PROVIDER` |
| `src/services/provider-credential.service.ts` | Remove `preferredProvider` from `updateSetting` input + `getSettings` return |
| `src/controllers/provider-credential.controller.ts` | Remove `preferredProvider` from Zod schema |
| `src/controllers/image.controller.ts` | Replace `user.preferredProvider` with `env.DEFAULT_AI_PROVIDER` |
| `app/api/settings/api-keys/route.ts` | Remove `preferredProvider` from PUT payload |
| `src/components/dashboard/dashboard-shell.tsx` | Remove API Settings nav link |

---

### Task 1: Remove `preferredProvider` from Prisma schema and push migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Remove the field from the User model**

In `prisma/schema.prisma`, find the `User` model and delete this line:
```
preferredProvider     AIProviderType          @default(OPENAI)
```

The model block should go from:
```prisma
model User {
  id                    String                  @id @default(cuid())
  email                 String                  @unique
  passwordHash          String
  role                  UserRole                @default(USER)
  preferredProvider     AIProviderType          @default(OPENAI)
  preferredModel        String?
  preferredPromptTemplateId String?
  ...
}
```
To:
```prisma
model User {
  id                    String                  @id @default(cuid())
  email                 String                  @unique
  passwordHash          String
  role                  UserRole                @default(USER)
  preferredModel        String?
  preferredPromptTemplateId String?
  ...
}
```

- [ ] **Step 2: Push the schema change to the database**

```bash
pnpm prisma generate && pnpm prisma db push
```

Expected output ends with: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: remove preferredProvider from User schema"
```

---

### Task 2: Update user repository

**Files:**
- Modify: `src/repositories/user.repository.ts`

- [ ] **Step 1: Remove `preferredProvider` from `createWithAutoRole`**

The method signature currently accepts `preferredProvider: AIProviderType` as the fourth parameter and passes it into `tx.user.create`. Remove that parameter and the `preferredProvider` field from the `data` object:

```typescript
async createWithAutoRole(
  email: string,
  passwordHash: string,
  defaultTemplateContent: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const userCount = await tx.user.count();
      const role: UserRole = userCount === 0 ? "ADMIN" : "USER";

      return tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          ownedPromptTemplates: {
            create: {
              name: "default-caption",
              version: 1,
              taskType: "CAPTION",
              content: defaultTemplateContent,
              isActive: true,
            },
          },
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
```

- [ ] **Step 2: Remove `updatePreferredProvider` method entirely**

Delete the entire method:
```typescript
async updatePreferredProvider(userId: string, provider: AIProviderType) {
  return prisma.user.update({
    where: { id: userId },
    data: { preferredProvider: provider },
  });
}
```

- [ ] **Step 3: Replace `updatePreferences` — remove `preferredProvider`, keep `preferredPromptTemplateId`**

Replace the existing method:
```typescript
async updatePreferences(
  userId: string,
  input: {
    preferredPromptTemplateId?: string;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      preferredPromptTemplateId: input.preferredPromptTemplateId ?? null,
    },
  });
}
```

- [ ] **Step 4: Remove unused `AIProviderType` import if no other method uses it**

Check the top of the file. If `AIProviderType` is no longer referenced anywhere, remove it from the import line:
```typescript
import type { Prisma, UserRole } from "@prisma/client";
```

- [ ] **Step 5: Commit**

```bash
git add src/repositories/user.repository.ts
git commit -m "feat: remove preferredProvider from user repository"
```

---

### Task 3: Update auth service

**Files:**
- Modify: `src/services/auth.service.ts`

- [ ] **Step 1: Remove the `env.DEFAULT_AI_PROVIDER` argument from `createWithAutoRole` call**

In `register()`, find:
```typescript
user = await this.users.createWithAutoRole(
  email,
  passwordHash,
  DEFAULT_TEMPLATE_CONTENT,
  env.DEFAULT_AI_PROVIDER,
);
```

Replace with:
```typescript
user = await this.users.createWithAutoRole(
  email,
  passwordHash,
  DEFAULT_TEMPLATE_CONTENT,
);
```

- [ ] **Step 2: Commit**

```bash
git add src/services/auth.service.ts
git commit -m "feat: stop seeding preferredProvider on registration"
```

---

### Task 4: Update AI generation service

**Files:**
- Modify: `src/services/ai-generation.service.ts`

- [ ] **Step 1: Replace the provider resolution line**

Find (around line 100):
```typescript
const provider = input.provider ?? user.preferredProvider ?? env.DEFAULT_AI_PROVIDER;
```

Replace with:
```typescript
const provider = input.provider ?? env.DEFAULT_AI_PROVIDER;
```

- [ ] **Step 2: Remove `user` fetch if it is now only used for `preferredPromptTemplateId`**

Check whether `user` is still needed after this change. It is — `user.preferredPromptTemplateId` is still read on lines ~92-93. Leave the `users.findById` call in place.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | tail -20
```

Expected: no errors referencing `preferredProvider`.

- [ ] **Step 4: Commit**

```bash
git add src/services/ai-generation.service.ts
git commit -m "feat: use env.DEFAULT_AI_PROVIDER as sole provider source"
```

---

### Task 5: Update provider credential service

**Files:**
- Modify: `src/services/provider-credential.service.ts`

- [ ] **Step 1: Remove `preferredProvider` from the `updateSetting` input type and body**

Replace the `updateSetting` method signature and internals. The method currently accepts `{ provider, preferredProvider, preferredModel, preferredPromptTemplateId }`. Remove `preferredProvider` and stop calling `users.updatePreferences` with it:

```typescript
async updateSetting(
  userId: string,
  payload: {
    provider: AIProviderType;
    preferredModel?: string;
    preferredPromptTemplateId?: string;
  },
) {
  const user = await this.users.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  if (payload.preferredPromptTemplateId) {
    const prompt = await this.promptTemplates.getActiveById("CAPTION", payload.preferredPromptTemplateId, userId);
    if (!prompt) {
      throw new Error("Prompt template not found.");
    }
  }

  await this.getRequiredApiKey(userId, payload.provider);

  const modelValue = payload.preferredModel?.trim() || null;
  const existingCredential = await this.credentials.findByUserIdAndProvider(userId, payload.provider);
  if (existingCredential) {
    await this.credentials.updateModel(userId, payload.provider, modelValue);
  } else if (modelValue) {
    await this.credentials.upsert(userId, payload.provider, "", modelValue);
  }

  await this.users.updatePreferences(user.id, {
    preferredPromptTemplateId: payload.preferredPromptTemplateId,
  });
}
```

- [ ] **Step 2: Remove `preferredProvider` from the `getSettings` return value**

In `getSettings`, the return object currently includes `preferredProvider: user.preferredProvider`. Remove that field:

```typescript
return {
  preferredPromptTemplateId: user.preferredPromptTemplateId,
  promptTemplates,
  keys: {},
  keyStatus,
  models,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/provider-credential.service.ts
git commit -m "feat: remove preferredProvider from credential service"
```

---

### Task 6: Update provider credential controller

**Files:**
- Modify: `src/controllers/provider-credential.controller.ts`

- [ ] **Step 1: Remove `preferredProvider` from the Zod schema and service call**

Replace the entire `updateSetting` method:

```typescript
async updateSetting(payload: unknown) {
  const parsed = z
    .object({
      userId: z.string().min(1),
      provider: providerSchema,
      preferredModel: z.string().optional(),
      preferredPromptTemplateId: z.string().optional(),
    })
    .parse(payload);

  await this.service.updateSetting(parsed.userId, {
    provider: parsed.provider,
    preferredModel: parsed.preferredModel,
    preferredPromptTemplateId: parsed.preferredPromptTemplateId,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/provider-credential.controller.ts
git commit -m "feat: remove preferredProvider from controller schema"
```

---

### Task 7: Update image controller

**Files:**
- Modify: `src/controllers/image.controller.ts`

- [ ] **Step 1: Add env import if not already present**

Check the top of the file. If `env` is not already imported, add:
```typescript
import { env } from "@/src/lib/env";
```

- [ ] **Step 2: Replace `user.preferredProvider` with `env.DEFAULT_AI_PROVIDER`**

Find (around line 68):
```typescript
const request = await this.aiRequests.createManualSucceeded({
  provider: user.preferredProvider,
  promptTemplateId: promptTemplate.id,
});
```

Replace with:
```typescript
const request = await this.aiRequests.createManualSucceeded({
  provider: env.DEFAULT_AI_PROVIDER,
  promptTemplateId: promptTemplate.id,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/image.controller.ts
git commit -m "feat: use env provider in image controller"
```

---

### Task 8: Update API settings route

**Files:**
- Modify: `app/api/settings/api-keys/route.ts`

- [ ] **Step 1: Remove `preferredProvider` from the PUT payload**

Replace the `PUT` handler payload type and the `updateSetting` call:

```typescript
export async function PUT(req: Request) {
  try {
    const user = await requireAuthUser();
    const payload = (await req.json()) as {
      provider?: string;
      preferredModel?: string;
      preferredPromptTemplateId?: string;
    };
    await container.providerCredentialController.updateSetting({
      userId: user.userId,
      provider: payload.provider,
      preferredModel: payload.preferredModel,
      preferredPromptTemplateId: payload.preferredPromptTemplateId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/settings/api-keys/route.ts
git commit -m "feat: remove preferredProvider from settings API route"
```

---

### Task 9: Hide API Settings from the navigation

**Files:**
- Modify: `src/components/dashboard/dashboard-shell.tsx`

- [ ] **Step 1: Remove the API Settings item from `buildNavGroups`**

Find the "Configure" group in `buildNavGroups`:
```typescript
{
  label: "Configure",
  items: [
    { href: "/dashboard/settings/api", label: "API Settings", icon: Settings, exact: false },
    { href: "/dashboard/prompt-templates", label: "Prompt Templates", icon: FileText, exact: false },
    ...(isAdmin
      ? [{ href: "/dashboard/admin/users", label: "User Management", icon: ShieldCheck, exact: false }]
      : []),
  ],
},
```

Remove the API Settings entry:
```typescript
{
  label: "Configure",
  items: [
    { href: "/dashboard/prompt-templates", label: "Prompt Templates", icon: FileText, exact: false },
    ...(isAdmin
      ? [{ href: "/dashboard/admin/users", label: "User Management", icon: ShieldCheck, exact: false }]
      : []),
  ],
},
```

- [ ] **Step 2: Remove the unused `Settings` icon import**

Change the import block from:
```typescript
import {
  Database,
  FileText,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
```
To:
```typescript
import {
  Database,
  FileText,
  Home,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/dashboard-shell.tsx
git commit -m "feat: hide API Settings page from navigation"
```

---

### Task 10: Final build check

- [ ] **Step 1: Run lint and build**

```bash
pnpm lint && pnpm build
```

Expected: no errors. If TypeScript complains about `preferredProvider` still being referenced anywhere, fix that file and commit.

- [ ] **Step 2: Restart the dev server to pick up schema changes**

```bash
pnpm docker:dev:down && pnpm docker:dev:up
```

- [ ] **Step 3: Verify in the database that no `preferredProvider` column exists**

```bash
mysql -h 127.0.0.1 -u root -ppassword vision_caption_studio -e "DESCRIBE User;" 2>/dev/null
```

Expected: no `preferredProvider` column in the output.
