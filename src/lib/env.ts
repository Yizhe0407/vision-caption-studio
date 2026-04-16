import { randomBytes } from "node:crypto";
import { z } from "zod";

const emptyToUndefined = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}, z.string().optional());

const envBoolean = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  return value;
}, z.boolean());

const runtimeEnv = process.env.NODE_ENV ?? "development";
const warnedMissingSecrets = new Set<string>();

function resolveSecret(
  envVarName: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET" | "API_KEY_ENCRYPTION_SECRET",
  developmentFallback: string,
) {
  const value = process.env[envVarName];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (runtimeEnv === "development" || runtimeEnv === "test") {
    return developmentFallback;
  }

  const generated = randomBytes(32).toString("hex");
  if (!warnedMissingSecrets.has(envVarName)) {
    warnedMissingSecrets.add(envVarName);
    console.warn(
      `[env] ${envVarName} is not set in ${runtimeEnv}; generated an ephemeral secret for this process.`,
    );
  }
  return generated;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  API_KEY_ENCRYPTION_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN_SEC: z.coerce.number().int().positive(),
  JWT_REFRESH_EXPIRES_IN_SEC: z.coerce.number().int().positive(),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_USERNAME: emptyToUndefined,
  REDIS_PASSWORD: emptyToUndefined,
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: envBoolean,
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  OPENAI_API_KEY: emptyToUndefined,
  OPENAI_MODEL: z.string().min(1),
  OPENROUTER_API_KEY: emptyToUndefined,
  OPENROUTER_MODEL: z.string().min(1),
  GEMINI_API_KEY: emptyToUndefined,
  GEMINI_MODEL: z.string().min(1),
  ANTHROPIC_API_KEY: emptyToUndefined,
  ANTHROPIC_MODEL: z.string().min(1),
  DEFAULT_AI_PROVIDER: z.enum(["OPENAI", "OPENROUTER", "GEMINI", "CLAUDE"]),
  OPENAI_INPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  OPENAI_OUTPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  OPENROUTER_INPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  OPENROUTER_OUTPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  GEMINI_INPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  GEMINI_OUTPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  CLAUDE_INPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  CLAUDE_OUTPUT_USD_PER_1K: z.coerce.number().nonnegative(),
  MAX_UPLOAD_FILE_SIZE_BYTES: z.coerce.number().int().positive(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: resolveSecret(
    "JWT_ACCESS_SECRET",
    "dev_access_secret_replace_in_production_123456",
  ),
  JWT_REFRESH_SECRET: resolveSecret(
    "JWT_REFRESH_SECRET",
    "dev_refresh_secret_replace_in_production_12345",
  ),
  API_KEY_ENCRYPTION_SECRET: resolveSecret(
    "API_KEY_ENCRYPTION_SECRET",
    "dev_api_key_encryption_secret_replace_1234",
  ),
  JWT_ACCESS_EXPIRES_IN_SEC: process.env.JWT_ACCESS_EXPIRES_IN_SEC ?? "900",
  JWT_REFRESH_EXPIRES_IN_SEC: process.env.JWT_REFRESH_EXPIRES_IN_SEC ?? "2592000",
  REDIS_HOST: process.env.REDIS_HOST ?? "127.0.0.1",
  REDIS_PORT: process.env.REDIS_PORT ?? "6379",
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
  MINIO_PORT: process.env.MINIO_PORT ?? "9000",
  MINIO_USE_SSL: process.env.MINIO_USE_SSL ?? "false",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  MINIO_BUCKET: process.env.MINIO_BUCKET ?? "vision-caption-studio",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
  DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER ?? "OPENAI",
  OPENAI_INPUT_USD_PER_1K: process.env.OPENAI_INPUT_USD_PER_1K ?? "0.00015",
  OPENAI_OUTPUT_USD_PER_1K: process.env.OPENAI_OUTPUT_USD_PER_1K ?? "0.0006",
  OPENROUTER_INPUT_USD_PER_1K: process.env.OPENROUTER_INPUT_USD_PER_1K ?? "0.001",
  OPENROUTER_OUTPUT_USD_PER_1K: process.env.OPENROUTER_OUTPUT_USD_PER_1K ?? "0.002",
  GEMINI_INPUT_USD_PER_1K: process.env.GEMINI_INPUT_USD_PER_1K ?? "0.00035",
  GEMINI_OUTPUT_USD_PER_1K: process.env.GEMINI_OUTPUT_USD_PER_1K ?? "0.00105",
  CLAUDE_INPUT_USD_PER_1K: process.env.CLAUDE_INPUT_USD_PER_1K ?? "0.003",
  CLAUDE_OUTPUT_USD_PER_1K: process.env.CLAUDE_OUTPUT_USD_PER_1K ?? "0.015",
  MAX_UPLOAD_FILE_SIZE_BYTES: process.env.MAX_UPLOAD_FILE_SIZE_BYTES ?? String(20 * 1024 * 1024),
});
