import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, GenerateCaptionInput, GenerateCaptionResult } from "@/src/infrastructure/ai/types";
import { parseGeneratedOutput } from "@/src/infrastructure/ai/providers/parse-generated-output";

export class GeminiProvider implements AIProvider {
  constructor(private readonly client: GoogleGenerativeAI) {}

  async generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
    const model = this.client.getGenerativeModel({ model: input.model });
    const response = await model.generateContent([
      input.prompt,
      {
        inlineData: {
          mimeType: input.mimeType,
          data: input.imageBuffer.toString("base64"),
        },
      },
    ]);

    const text = response.response.text();
    const parsed = parseGeneratedOutput(text);
    const usageMetadata = response.response.usageMetadata;

    return {
      caption: parsed.caption,
      tags: parsed.tags,
      usage: {
        inputTokens: usageMetadata?.promptTokenCount ?? 0,
        outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }
}
