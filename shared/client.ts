/**
 * OATDA API Client for Skills
 *
 * Provides a unified interface for all OATDA skills to communicate
 * with the OATDA API endpoint. Handles authentication, error handling,
 * retry logic, and response parsing.
 *
 * API Endpoint Mapping (matches actual OATDA REST API):
 * - Chat completion: POST /api/v1/llm
 * - Vision analysis: POST /api/v1/llm/image
 * - Image generation: POST /api/v1/llm/generate-image
 * - Video generation: POST /api/v1/llm/generate-video?async=true
 * - Video status:     GET  /api/v1/llm/video-status/{taskId}
 * - List models:      GET  /api/v1/models
 *
 * @module oatda-client
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * OATDA Client Configuration
 */
export interface OatdaClientConfig {
  /** OATDA API base URL (default: https://oatda.com) */
  baseUrl?: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds (default: 120000) */
  timeout?: number;
  /** Custom user agent for requests */
  userAgent?: string;
  /** Max retries for transient failures (default: 2) */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

/**
 * OATDA API Response Wrapper
 */
export interface OatdaResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: OatdaError;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
}

/**
 * OATDA Error Structure
 */
export interface OatdaError {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Chat Completion
// ---------------------------------------------------------------------------

/**
 * Chat Completion Parameters
 *
 * The OATDA REST API at POST /api/v1/llm expects a `prompt` string.
 * This client accepts either `prompt` (single string) or `messages`
 * (array) and converts messages to a single prompt before sending.
 */
export interface ChatCompletionParams {
  /** Model identifier (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet") */
  model: string;
  /** Single prompt string (preferred, sent directly to API) */
  prompt?: string;
  /** Conversation messages (converted to prompt string for API) */
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /** Sampling temperature (0-2, lower = more focused) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Enable streaming response */
  stream?: boolean;
  /** Service tier */
  serviceTier?: 'standard' | 'flex' | 'priority' | 'scale';
}

/**
 * Chat Completion Response (from POST /api/v1/llm)
 */
export interface ChatCompletionResponse {
  /** Whether the request succeeded */
  success: boolean;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Generated text */
  response: string;
  /** Token usage details */
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
    cache_hit_tokens?: number;
    cache_miss_tokens?: number;
    cache_hit_rate?: number;
  };
  /** Cost breakdown */
  cost?: {
    totalCost: number;
    currency: string;
  };
}

// ---------------------------------------------------------------------------
// Vision Analysis
// ---------------------------------------------------------------------------

/**
 * Content item for vision analysis (matches API `contents` array)
 */
export interface VisionContentItem {
  type: 'text' | 'image' | 'input_text' | 'input_image';
  text?: string;
  image?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/**
 * Vision Analysis Parameters
 *
 * The OATDA REST API at POST /api/v1/llm/image expects a `contents`
 * array with text and image items. This client provides a convenience
 * interface with `prompt` + `imageUrl` that gets converted.
 */
export interface VisionParams {
  /** Model identifier (must be vision-capable, e.g., "openai/gpt-4o") */
  model: string;
  /** Analysis prompt/question */
  prompt: string;
  /** Image URL or base64 data URI */
  imageUrl: string;
  /** Image detail level */
  imageDetail?: 'low' | 'high' | 'auto';
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Service tier */
  serviceTier?: 'standard' | 'flex' | 'priority' | 'scale';
}

/**
 * Vision Analysis Response (from POST /api/v1/llm/image)
 */
export interface VisionAnalysisResponse {
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Analysis text */
  response: string;
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Latency in ms */
  latency?: number;
  /** Cost breakdown */
  costs?: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };
}

// ---------------------------------------------------------------------------
// Image Generation
// ---------------------------------------------------------------------------

/**
 * Image Generation Parameters
 *
 * Matches POST /api/v1/llm/generate-image request body.
 */
export interface ImageGenerationParams {
  /** Model identifier (e.g., "openai/dall-e-3", "google/imagen-4.0-generate-001") */
  model: string;
  /** Image generation prompt (1-4000 chars) */
  prompt: string;
  /** Image size (e.g., "1024x1024", "1792x1024") */
  size?: string;
  /** Image quality */
  quality?: 'standard' | 'hd' | 'auto' | 'low' | 'medium' | 'high';
  /** Number of images (1-10) */
  n?: number;
  /** Aspect ratio */
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto';
  /** Image style */
  style?: 'vivid' | 'natural';
  /** Background mode */
  background?: 'auto' | 'transparent' | 'opaque';
  /** Person generation control */
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
  /** Output format */
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

/**
 * Image Generation Response
 */
export interface ImageGenerationResponse {
  /** Generated image URLs */
  urls: string[];
  /** Revised prompt (if applicable) */
  revisedPrompt?: string;
}

// ---------------------------------------------------------------------------
// Video Generation
// ---------------------------------------------------------------------------

/**
 * Video Generation Parameters
 *
 * Matches POST /api/v1/llm/generate-video request body.
 */
export interface VideoGenerationParams {
  /** Model identifier (e.g., "minimax/T2V-01", "google/veo-3.0-generate-preview") */
  model: string;
  /** Video generation prompt (1-4000 chars) */
  prompt: string;
  /** Video duration in seconds */
  duration?: number;
  /** Resolution (e.g., "720P", "1080P") */
  resolution?: string;
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Quality setting */
  quality?: string;
  /** Style setting */
  style?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

/**
 * Video Generation Response (async mode)
 */
export interface VideoGenerationResponse {
  /** Task ID for polling */
  taskId: string;
  /** Task status */
  status: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Human-readable message */
  message?: string;
  /** URL to poll for status */
  pollUrl?: string;
}

/**
 * Video Status Response
 */
export interface VideoStatusResponse {
  /** Task ID */
  taskId: string;
  /** Status: pending, processing, completed, failed */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Video URL (when completed) */
  videoUrl?: string;
  /** Direct video URL (alternative, when completed) */
  directVideoUrl?: string;
  /** Error message (when failed) */
  errorMessage?: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Creation timestamp (ISO) */
  createdAt: string;
  /** Completion timestamp (ISO, when completed) */
  completedAt?: string;
  /** Cost information */
  costs?: {
    totalCost: number;
    currency: string;
  };
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

/**
 * Model List Filters
 */
export interface ModelFilters {
  /** Filter by type: all, chat, image, video */
  type?: 'all' | 'chat' | 'image' | 'video';
  /** Filter by provider name */
  provider?: string;
}

/**
 * Model Information
 */
export interface ModelInfo {
  /** Model ID (provider/model_name) */
  id: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Display name */
  displayName: string;
}

/**
 * Models List Response
 */
export interface ModelsListResponse {
  /** Total models matching filter */
  total: number;
  /** Applied filters */
  filter: {
    type: string;
    provider: string | null;
  };
  /** Chat models */
  chatModels?: ModelInfo[];
  /** Image models */
  imageModels?: ModelInfo[];
  /** Video models */
  videoModels?: ModelInfo[];
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate model identifier format (provider/model)
 */
function validateModelId(model: string): { provider: string; modelName: string } {
  if (!model || typeof model !== 'string') {
    throw new Error('Model identifier is required');
  }

  const parts = model.split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid model format: "${model}". Expected "provider/model" (e.g., "openai/gpt-4o")`
    );
  }

  return { provider: parts[0], modelName: parts.slice(1).join('/') };
}

/**
 * Validate prompt string
 */
function validatePrompt(prompt: string, maxLength: number = 128000): void {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }
  if (prompt.length > maxLength) {
    throw new Error(`Prompt exceeds maximum length of ${maxLength} characters`);
  }
}

/**
 * Validate image URL (basic SSRF-prevention for obvious cases)
 */
function validateImageUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new Error('Image URL is required');
  }

  // Allow data URIs (base64 inline images)
  if (url.startsWith('data:image/')) {
    return;
  }

  // Must be HTTPS for remote URLs
  if (!url.startsWith('https://')) {
    throw new Error(
      'Image URL must use HTTPS protocol or be a data URI (data:image/...)'
    );
  }

  // Block private/internal IPs (basic check, server does full SSRF protection)
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const blocked = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      '169.254.169.254', // AWS metadata
      'metadata.google.internal', // GCP metadata
    ];
    if (blocked.includes(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      throw new Error('Image URL points to a blocked internal address');
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('blocked')) throw e;
    throw new Error(`Invalid image URL: ${url}`);
  }
}

/**
 * Convert messages array to a single prompt string for the API
 */
function messagesToPrompt(
  messages: Array<{ role: string; content: string }>
): string {
  if (messages.length === 1) {
    return messages[0].content;
  }

  return messages
    .map((m) => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return m.content;
    })
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Retryable HTTP status codes
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'UND_ERR_CONNECT_TIMEOUT']);

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// OATDA API Client
// ---------------------------------------------------------------------------

/**
 * OATDA API Client
 *
 * All methods validate inputs before sending requests and automatically
 * retry transient failures with exponential backoff.
 */
export class OatdaClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private userAgent: string;
  private maxRetries: number;

  constructor(config: OatdaClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required to create an OatdaClient');
    }

    this.baseUrl = (config.baseUrl || 'https://oatda.com').replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 120000;
    this.userAgent = config.userAgent || 'OATDA-Skills/1.0.0';
    this.maxRetries = config.maxRetries ?? 2;
  }

  /**
   * Make an authenticated request to the OATDA API with retry logic
   *
   * Retries on: network errors, 408, 429, 500, 502, 503, 504
   * Backoff: 1s, 2s (exponential)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<OatdaResponse<T>> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    let lastError: OatdaResponse<T> | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s...
        await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': this.userAgent,
            ...(options.headers as Record<string, string>),
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response body
        let data: Record<string, unknown>;
        try {
          data = await response.json() as Record<string, unknown>;
        } catch {
          data = {};
        }

        // Retryable HTTP status
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          lastError = {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: (data.error as Record<string, string>)?.message || (data.message as string) || response.statusText,
            },
          };
          continue;
        }

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: (data.error as Record<string, string>)?.code || `HTTP_${response.status}`,
              message: this.sanitizeErrorMessage(
                (data.error as Record<string, string>)?.message || (data.message as string) || response.statusText
              ),
              details: (data.error as Record<string, unknown>)?.details,
            },
          };
        }

        // Normalize usage from different API response formats
        const usage = this.extractUsage(data);

        return {
          success: true,
          data: (data.data ?? data) as T,
          usage,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const isRetryable = isTimeout ||
          (error instanceof Error && RETRYABLE_ERROR_CODES.has((error as NodeJS.ErrnoException).code || ''));

        if (isRetryable && attempt < this.maxRetries) {
          lastError = {
            success: false,
            error: {
              code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
              message: isTimeout
                ? `Request timeout after ${this.timeout}ms`
                : (error instanceof Error ? error.message : 'Unknown network error'),
            },
          };
          continue;
        }

        if (isTimeout) {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Request timeout after ${this.timeout}ms`,
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error instanceof Error
              ? this.sanitizeErrorMessage(error.message)
              : 'Unknown network error',
          },
        };
      }
    }

    // All retries exhausted
    return lastError || {
      success: false,
      error: { code: 'MAX_RETRIES', message: 'All retry attempts exhausted' },
    };
  }

  /**
   * Extract normalised usage from various API response formats
   */
  private extractUsage(data: Record<string, unknown>): OatdaResponse['usage'] | undefined {
    // POST /api/v1/llm format
    const tokenUsage = data.tokenUsage as Record<string, number> | undefined;
    if (tokenUsage) {
      return {
        promptTokens: tokenUsage.prompt_tokens || 0,
        completionTokens: tokenUsage.completion_tokens || 0,
        totalTokens: tokenUsage.total_tokens || 0,
        cost: tokenUsage.cost || (data.cost as Record<string, number>)?.totalCost || 0,
      };
    }

    // Vision / other format
    const usage = data.usage as Record<string, number> | undefined;
    if (usage) {
      return {
        promptTokens: usage.promptTokens || usage.prompt_tokens || 0,
        completionTokens: usage.completionTokens || usage.completion_tokens || 0,
        totalTokens: usage.totalTokens || usage.total_tokens || 0,
        cost: (data.costs as Record<string, number>)?.totalCost || (data.cost as Record<string, number>)?.totalCost || 0,
      };
    }

    // Cost-only format
    const costs = data.costs as Record<string, number> | undefined;
    if (costs?.totalCost) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: costs.totalCost,
      };
    }

    return undefined;
  }

  /**
   * Ensure API key never leaks into error messages
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message) return message;
    // Redact anything that looks like an API key
    return message.replace(
      /\b(oatda_|sk_|oatda-)[A-Za-z0-9_-]{16,}\b/g,
      '[REDACTED]'
    );
  }

  // -------------------------------------------------------------------------
  // Chat Completion — POST /api/v1/llm
  // -------------------------------------------------------------------------

  /**
   * Chat completion - generate text using LLM providers
   *
   * API: POST /api/v1/llm
   * Body: { provider, model, prompt, temperature?, maxTokens?, stream? }
   */
  async chatCompletion(params: ChatCompletionParams): Promise<OatdaResponse<ChatCompletionResponse>> {
    // Determine prompt string
    let prompt: string;
    if (params.prompt) {
      prompt = params.prompt;
    } else if (params.messages && params.messages.length > 0) {
      prompt = messagesToPrompt(params.messages);
    } else {
      throw new Error('Either "prompt" or "messages" is required for chat completion');
    }

    const { provider, modelName } = validateModelId(params.model);
    validatePrompt(prompt);

    return this.request<ChatCompletionResponse>('/llm', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        stream: params.stream ?? false,
        ...(params.serviceTier ? { service_tier: params.serviceTier } : {}),
      }),
    });
  }

  // -------------------------------------------------------------------------
  // Vision Analysis — POST /api/v1/llm/image
  // -------------------------------------------------------------------------

  /**
   * Vision analysis - analyze images with vision models
   *
   * API: POST /api/v1/llm/image
   * Body: { provider, model, contents: [{type:'text',text}, {type:'image',image:{url}}] }
   */
  async visionAnalysis(params: VisionParams): Promise<OatdaResponse<VisionAnalysisResponse>> {
    const { provider, modelName } = validateModelId(params.model);
    validatePrompt(params.prompt, 128000);
    validateImageUrl(params.imageUrl);

    // Build contents array matching the API format
    const contents: VisionContentItem[] = [
      { type: 'text', text: params.prompt },
      {
        type: 'image',
        image: {
          url: params.imageUrl,
          detail: params.imageDetail || 'auto',
        },
      },
    ];

    return this.request<VisionAnalysisResponse>('/llm/image', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        contents,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        ...(params.serviceTier ? { service_tier: params.serviceTier } : {}),
      }),
    });
  }

  // -------------------------------------------------------------------------
  // Image Generation — POST /api/v1/llm/generate-image
  // -------------------------------------------------------------------------

  /**
   * Image generation - create images using AI models
   *
   * API: POST /api/v1/llm/generate-image
   */
  async generateImage(params: ImageGenerationParams): Promise<OatdaResponse<ImageGenerationResponse>> {
    const { provider, modelName } = validateModelId(params.model);
    validatePrompt(params.prompt, 4000);

    if (params.n !== undefined && (params.n < 1 || params.n > 10)) {
      throw new Error('Number of images (n) must be between 1 and 10');
    }

    const response = await this.request<{
      url?: string;
      all_images?: Array<{ url: string }>;
      revised_prompt?: string;
    }>('/llm/generate-image', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt: params.prompt,
        size: params.size,
        quality: params.quality || 'standard',
        n: params.n ?? 1,
        numberOfImages: params.n ?? 1,
        aspectRatio: params.aspectRatio || '1:1',
        style: params.style || 'vivid',
        background: params.background,
        personGeneration: params.personGeneration || 'allow_adult',
        outputFormat: params.outputFormat,
      }),
    });

    if (!response.success || !response.data) {
      return response as OatdaResponse<ImageGenerationResponse>;
    }

    const data = response.data;
    const urls = data.all_images?.map((img) => img.url) || (data.url ? [data.url] : []);

    return {
      success: true,
      data: {
        urls,
        revisedPrompt: data.revised_prompt,
      },
      usage: response.usage,
    };
  }

  // -------------------------------------------------------------------------
  // Video Generation — POST /api/v1/llm/generate-video?async=true
  // -------------------------------------------------------------------------

  /**
   * Video generation - create videos using AI models (async)
   *
   * API: POST /api/v1/llm/generate-video?async=true
   * Returns a task ID for polling with getVideoStatus()
   */
  async generateVideo(params: VideoGenerationParams): Promise<OatdaResponse<VideoGenerationResponse>> {
    const { provider, modelName } = validateModelId(params.model);
    validatePrompt(params.prompt, 4000);

    return this.request<VideoGenerationResponse>('/llm/generate-video?async=true', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt: params.prompt,
        duration: params.duration,
        resolution: params.resolution,
        aspectRatio: params.aspectRatio,
        quality: params.quality,
        style: params.style,
        width: params.width,
        height: params.height,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // Video Status — GET /api/v1/llm/video-status/{taskId}
  // -------------------------------------------------------------------------

  /**
   * Video status - check async video generation status
   *
   * API: GET /api/v1/llm/video-status/{taskId}
   */
  async getVideoStatus(taskId: string): Promise<OatdaResponse<VideoStatusResponse>> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
      throw new Error('Task ID is required');
    }

    // Sanitize taskId to prevent path traversal
    const sanitizedId = encodeURIComponent(taskId.trim());

    return this.request<VideoStatusResponse>(`/llm/video-status/${sanitizedId}`, {
      method: 'GET',
    });
  }

  // -------------------------------------------------------------------------
  // List Models — GET /api/v1/models
  // -------------------------------------------------------------------------

  /**
   * List models - get available models with filtering
   *
   * API: GET /api/v1/models
   */
  async listModels(filters?: ModelFilters): Promise<OatdaResponse<ModelsListResponse>> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }
    if (filters?.provider) {
      params.append('provider', filters.provider);
    }

    const queryString = params.toString();
    const endpoint = `/models${queryString ? `?${queryString}` : ''}`;

    return this.request<ModelsListResponse>(endpoint, {
      method: 'GET',
    });
  }

  // -------------------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------------------

  /**
   * Test API connection and key validity
   *
   * Makes a lightweight list-models call to verify the key works.
   */
  async testConnection(): Promise<OatdaResponse<{ status: string }>> {
    const result = await this.listModels({ type: 'chat' });
    if (result.success) {
      return { success: true, data: { status: 'connected' } };
    }
    return {
      success: false,
      error: result.error,
    };
  }
}
