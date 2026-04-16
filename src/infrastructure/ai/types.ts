export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GenerateCaptionInput = {
  prompt: string;
  mimeType: string;
  imageBuffer: Buffer;
  model: string;
};

export type GenerateCaptionResult = {
  caption: string;
  tags: string[];
  usage: AIUsage;
};

export interface AIProvider {
  generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult>;
}
