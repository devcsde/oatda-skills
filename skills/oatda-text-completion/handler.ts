/**
 * OATDA Text Completion Skill Handler
 *
 * Core implementation that connects to OATDA API
 * and returns formatted results to Claude Code.
 *
 * This skill generates text using any of OATDA's 13+ LLM providers.
 *
 * @module oatda-text-completion
 */

import { OatdaClient, type ChatCompletionParams } from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * Text Completion Result
 */
export interface TextCompletionResult {
  /** Generated text content */
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
    input: number;
    output: number;
    currency: string;
  };
}

/**
 * Main skill handler for text completion
 *
 * @param params - Completion parameters
 * @param params.model - Model identifier (e.g., "openai/gpt-4o")
 * @param params.messages - Conversation messages
 * @param params.temperature - Sampling temperature (0-2)
 * @param params.maxTokens - Maximum tokens to generate
 * @param params.stream - Enable streaming response
 * @returns Generated text with metadata
 */
export async function oatdaTextCompletion(
  params: ChatCompletionParams
): Promise<TextCompletionResult> {
  // Resolve API key from multiple sources
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client
  const client = new OatdaClient({
    apiKey,
    timeout: 120000, // 2 minutes
  });

  // Make API request
  const response = await client.chatCompletion(params);

  // Handle errors
  if (!response.success) {
    throw new Error(
      `OATDA API Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  // Extract model and provider
  const [provider, modelName] = params.model.split('/');

  return {
    text: response.data as string,
    model: modelName,
    provider,
    usage: response.usage,
    cost: response.usage
      ? {
          total: response.usage.cost,
          input: 0, // Not provided by API
          output: 0, // Not provided by API
          currency: 'USD',
        }
      : undefined,
  };
}

/**
 * Parse model identifier from user prompt
 *
 * Handles various formats:
 * - "using gpt-4o" -> "openai/gpt-4o"
 * - "with claude" -> "anthropic/claude-3-5-sonnet"
 * - "gemini" -> "google/gemini-2.0-flash"
 *
 * @param modelInput - User-provided model reference
 * @returns Full model identifier
 */
export function parseModelIdentifier(modelInput: string): string {
  const input = modelInput.toLowerCase().trim();

  // Already in provider/model format
  if (input.includes('/')) {
    return input;
  }

  // Map common aliases to full identifiers
  const modelAliases: Record<string, string> = {
    // OpenAI
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4': 'openai/gpt-4-turbo',
    'gpt-3.5': 'openai/gpt-3.5-turbo',
    'o1': 'openai/o1',

    // Anthropic
    'claude': 'anthropic/claude-3-5-sonnet',
    'claude-3.5': 'anthropic/claude-3-5-sonnet',
    'claude-3': 'anthropic/claude-3-opus',
    'sonnet': 'anthropic/claude-3-5-sonnet',
    'opus': 'anthropic/claude-3-opus',
    'haiku': 'anthropic/claude-3-5-haiku',

    // Google
    'gemini': 'google/gemini-2.0-flash',
    'gemini-2': 'google/gemini-2.0-flash',
    'gemini-1.5': 'google/gemini-1.5-pro',

    // Deepseek
    'deepseek': 'deepseek/deepseek-chat',

    // Mistral
    'mistral': 'mistral/mistral-large',

    // xAI
    'grok': 'xai/grok-2',

    // Alibaba
    'qwen': 'alibaba/qwen-max',
  };

  return modelAliases[input] || `openai/${input}`;
}

/**
 * Extract completion parameters from user prompt
 *
 * Analyzes prompt for model, temperature, and other parameters
 *
 * @param prompt - User's full prompt
 * @returns Parsed parameters
 */
export function extractCompletionParams(prompt: string): {
  model: string;
  messages: Array<{ role: 'user'; content: string }>;
  temperature?: number;
  maxTokens?: number;
} {
  // Default model
  let model = 'openai/gpt-4o';

  // Check for model specification
  const modelPatterns = [
    /using\s+(\S+(?:\s+\S+)?)/i,
    /with\s+(\S+(?:\s+\S+)?)/i,
    /via\s+(\S+(?:\s+\S+)?)/i,
    /model\s+[":](\S+(?:\s+\S+)?)/i,
  ];

  for (const pattern of modelPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const potentialModel = match[1].toLowerCase().trim();
      // Check if it's a valid model reference
      if (/^[a-z0-9]+(?:\/[a-z0-9.-]+)?$/.test(potentialModel)) {
        model = parseModelIdentifier(potentialModel);
        break;
      }
    }
  }

  // Extract temperature if specified
  const tempMatch = prompt.match(/temperature[:\s]+(\d+(?:\.\d+)?)/i);
  const temperature = tempMatch ? parseFloat(tempMatch[1]) : undefined;

  // Extract max tokens if specified
  const tokensMatch = prompt.match(/max[_\s]?tokens?[:\s]+(\d+)/i);
  const maxTokens = tokensMatch ? parseInt(tokensMatch[1], 10) : undefined;

  return {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    maxTokens,
  };
}

/**
 * Format completion result for display
 *
 * @param result - Completion result
 * @returns Formatted output string
 */
export function formatCompletionResult(result: TextCompletionResult): string {
  let output = result.text;

  // Add metadata footer if usage available
  if (result.usage || result.cost) {
    output += '\n\n---\n';
    output += `Model: ${result.provider}/${result.model}`;

    if (result.usage) {
      output += `\nTokens: ${result.usage.totalTokens} (${result.usage.promptTokens} + ${result.usage.completionTokens})`;
    }

    if (result.cost) {
      output += `\nCost: $${result.cost.total.toFixed(6)}`;
    }
  }

  return output;
}
