/**
 * OATDA List Models Skill Handler
 *
 * List available AI models with filtering.
 * API: GET /api/v1/models
 *
 * @module oatda-list-models
 */

import {
  OatdaClient,
  type ModelFilters,
  type ModelsListResponse,
  type ModelInfo,
} from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * List Models Result
 */
export interface ListModelsResult {
  /** Total matching models */
  total: number;
  /** Applied filters */
  filter: {
    type: string;
    provider: string | null;
  };
  /** Chat/text models */
  chatModels: ModelInfo[];
  /** Image generation models */
  imageModels: ModelInfo[];
  /** Video generation models */
  videoModels: ModelInfo[];
}

/**
 * Main skill handler for listing models
 *
 * @param filters - Optional filters
 * @param filters.type - "all", "chat", "image", or "video"
 * @param filters.provider - Provider name filter (e.g., "openai")
 * @returns Categorized model list
 */
export async function oatdaListModels(
  filters?: ModelFilters
): Promise<ListModelsResult> {
  // Resolve API key
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client
  const client = new OatdaClient({
    apiKey,
    timeout: 30000, // 30 seconds is enough for listing
  });

  // Make API request
  const response = await client.listModels(filters);

  // Handle errors
  if (!response.success || !response.data) {
    throw new Error(
      `OATDA Models API Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  const data = response.data as ModelsListResponse;

  return {
    total: data.total || 0,
    filter: data.filter || { type: filters?.type || 'all', provider: filters?.provider || null },
    chatModels: data.chatModels || [],
    imageModels: data.imageModels || [],
    videoModels: data.videoModels || [],
  };
}

/**
 * Format models list for display
 */
export function formatModelsResult(result: ListModelsResult): string {
  let output = `Available Models (${result.total} total)`;

  if (result.filter.provider) {
    output += ` — Provider: ${result.filter.provider}`;
  }
  if (result.filter.type !== 'all') {
    output += ` — Type: ${result.filter.type}`;
  }
  output += '\n';

  if (result.chatModels.length > 0) {
    output += `\n## Chat Models (${result.chatModels.length})\n`;
    for (const model of result.chatModels) {
      output += `- ${model.id} — ${model.displayName}\n`;
    }
  }

  if (result.imageModels.length > 0) {
    output += `\n## Image Models (${result.imageModels.length})\n`;
    for (const model of result.imageModels) {
      output += `- ${model.id} — ${model.displayName}\n`;
    }
  }

  if (result.videoModels.length > 0) {
    output += `\n## Video Models (${result.videoModels.length})\n`;
    for (const model of result.videoModels) {
      output += `- ${model.id} — ${model.displayName}\n`;
    }
  }

  if (result.total === 0) {
    output += '\nNo models found matching the specified filters.\n';
  }

  return output;
}
