/**
 * OATDA Vision Analysis Skill Handler
 *
 * Analyze images using vision-capable AI models.
 * API: POST /api/v1/llm/image
 *
 * @module oatda-vision-analysis
 */

import {
  OatdaClient,
  type VisionParams,
  type VisionAnalysisResponse,
} from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * Vision Analysis Result
 */
export interface VisionAnalysisResult {
  /** Analysis text */
  text: string;
  /** Model used */
  model: string;
  /** Provider used */
  provider: string;
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Cost information */
  cost?: {
    total: number;
    currency: string;
  };
  /** Response latency in ms */
  latency?: number;
}

/**
 * Main skill handler for vision analysis
 *
 * @param params - Vision analysis parameters
 * @param params.model - Vision-capable model ID (e.g., "openai/gpt-4o")
 * @param params.prompt - Analysis question/instruction
 * @param params.imageUrl - Image URL (HTTPS) or base64 data URI
 * @param params.imageDetail - Detail level: "low", "high", or "auto"
 * @param params.temperature - Sampling temperature (0-2)
 * @param params.maxTokens - Maximum response tokens
 * @returns Analysis result with metadata
 */
export async function oatdaVisionAnalysis(
  params: VisionParams
): Promise<VisionAnalysisResult> {
  // Resolve API key
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client
  const client = new OatdaClient({
    apiKey,
    timeout: 120000,
  });

  // Make API request
  const response = await client.visionAnalysis(params);

  // Handle errors
  if (!response.success) {
    throw new Error(
      `OATDA Vision API Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  const data = response.data as VisionAnalysisResponse;
  const [provider, modelName] = params.model.split('/');

  return {
    text: data?.response || String(data || ''),
    model: data?.model || modelName,
    provider: data?.provider || provider,
    usage: response.usage
      ? {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
        }
      : undefined,
    cost: response.usage
      ? {
          total: response.usage.cost,
          currency: 'USD',
        }
      : undefined,
    latency: data?.latency,
  };
}

/**
 * Format vision analysis result for display
 */
export function formatVisionResult(result: VisionAnalysisResult): string {
  let output = result.text;

  if (result.usage || result.cost) {
    output += '\n\n---\n';
    output += `Model: ${result.provider}/${result.model}`;

    if (result.usage) {
      output += `\nTokens: ${result.usage.totalTokens} (${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion)`;
    }

    if (result.cost) {
      output += `\nCost: $${result.cost.total.toFixed(6)}`;
    }

    if (result.latency) {
      output += `\nLatency: ${result.latency}ms`;
    }
  }

  return output;
}
