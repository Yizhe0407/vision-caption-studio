import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AIProviderType } from "@prisma/client";
import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";
import { env } from "@/src/lib/env";

export const runtime = "nodejs";

function getDefaultModel(provider: AIProviderType) {
  return provider === "OPENROUTER"
    ? env.OPENROUTER_MODEL
    : provider === "GEMINI"
      ? env.GEMINI_MODEL
      : provider === "CLAUDE"
        ? env.ANTHROPIC_MODEL
        : env.OPENAI_MODEL;
}

async function verifyApiKey(provider: AIProviderType, apiKey: string, model: string) {
  switch (provider) {
    case "OPENAI": {
      const client = new OpenAI({ apiKey });
      await client.responses.create({
        model,
        input: [{ role: "user", content: [{ type: "input_text", text: "ping" }] }],
        max_output_tokens: 8,
      });
      return;
    }
    case "OPENROUTER": {
      const client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
      await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 8,
      });
      return;
    }
    case "GEMINI": {
      const client = new GoogleGenerativeAI(apiKey);
      const modelClient = client.getGenerativeModel({ model });
      await modelClient.generateContent("ping");
      return;
    }
    case "CLAUDE": {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      });
      return;
    }
    default:
      throw new Error(`Unsupported provider: ${provider as string}`);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthUser();
    const payload = (await req.json()) as {
      provider?: AIProviderType;
      apiKey?: string;
      model?: string;
    };

    const provider = payload.provider;
    if (!provider) {
      throw new Error("Provider is required.");
    }

    const apiKey =
      payload.apiKey && payload.apiKey.trim().length > 0
        ? payload.apiKey.trim()
        : await container.providerCredentialService.getRequiredApiKey(user.userId, provider);
    const model = payload.model?.trim() || getDefaultModel(provider);

    await verifyApiKey(provider, apiKey, model);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
