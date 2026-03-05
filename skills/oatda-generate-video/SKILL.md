---
name: oatda-generate-video
description: Use when the user wants to generate videos using AI models through OATDA's unified API. Supports MiniMax, Google Veo, Alibaba Wan, ZAI, and OpenAI Sora. Video generation is asynchronous.
---

# OATDA Video Generation

Generate videos from text descriptions using AI models through OATDA's unified API. Video generation is **asynchronous** — you submit a request and receive a task ID to poll for status.

## When to Use

Use this skill when the user wants to:
- Generate a video from a text description via OATDA
- Create AI-generated video clips
- Use MiniMax, Google Veo, Alibaba Wan, or other video models

## Prerequisites

The user needs an OATDA API key. Check in this order:
1. `$OATDA_API_KEY` environment variable
2. `~/.oatda/credentials.json` config file

If neither exists, tell the user:
> You need an OATDA API key. Get one at https://oatda.com, then set it:
> `export OATDA_API_KEY=your_key_here`

## Step-by-Step Instructions

### 1. Resolve the API key

```bash
# Check env var first; if empty, auto-load from credentials file
if [[ -z "$OATDA_API_KEY" ]]; then
  export OATDA_API_KEY=$(cat ~/.oatda/credentials.json 2>/dev/null | jq -r '.profiles[.defaultProfile].apiKey' 2>/dev/null)
fi

# Verify key exists (show first 8 chars only)
echo "${OATDA_API_KEY:0:8}"
```

If the output is empty or `null`, stop and ask the user to configure their API key.

**IMPORTANT**:
- Never print the full API key. Only show the first 8 characters for verification.
- The key resolution script and subsequent `curl` commands **must run in the same shell session**. Each separate bash/terminal invocation starts with an isolated environment where previously exported variables are lost. Either run all commands in one session, or chain them (e.g., `export OATDA_API_KEY=... && curl ...`).

### 2. Determine the model

Map common aliases:

| User says | Provider | Model |
|-----------|----------|-------|
| seedance, bytedance (default) | bytedance | seedance-1-5-pro-251215 |
| minimax, t2v | minimax | T2V-01 |
| veo, google veo | google | veo-3.0-generate-preview |
| wan, alibaba | alibaba | wan-t2v |
| sora | openai | sora |
| grok video | xai | grok-2-video |

**Default**: `bytedance` / `seedance-1-5-pro-251215` if no model specified.

### 3. Discover model-specific parameters

**IMPORTANT**: Different models support different parameters. Before generating, discover what parameters a model supports:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=video" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.video_models[] | {id, supported_params}'
```

This returns each video model's `supported_params` with:
- `type`: Parameter type (string, number, boolean, file)
- `values`: Allowed values for enums
- `default`: Default value
- `description`: What the parameter does
- `optional`: Whether it's required
- `accept`: For file types, what's accepted (e.g., "image/*")

**File-type parameters**: Parameters like `first_frame_image` or `last_frame_image` require publicly accessible URLs (https://...), not local file paths.

Pass model-specific parameters via the `model_params` object (see examples below).

### 4. Make the API call

**CRITICAL**: The endpoint URL includes `?async=true` query parameter.

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "<PROVIDER>",
    "model": "<MODEL>",
    "prompt": "<VIDEO_DESCRIPTION>"
  }'
```

Replace `<PROVIDER>`, `<MODEL>`, and `<VIDEO_DESCRIPTION>` with actual values.

**Optional parameters** (add to body):
- `duration`: Video duration in seconds
- `resolution`: `"720P"` or `"1080P"`
- `aspectRatio`: `"16:9"`, `"9:16"`, or `"1:1"`
- `quality`: Quality setting (model-dependent)
- `style`: Style setting (model-dependent)
- `width` / `height`: Explicit pixel dimensions
- `model_params`: **Model-specific parameters** as key-value pairs. Use `list_models?type=video` or `/api/v1/llm/models` to discover supported params per model. Examples:
  - Seedance: `{ "ratio": "16:9", "duration": "5", "generate_audio": true, "camera_fixed": false }`
  - Seedance I2V: `{ "first_frame_image": "https://...", "last_frame_image": "https://..." }`
  - MiniMax: `{ "first_frame_image": "https://...", "resolution": "720P" }`
  - xAI: `{ "resolution": "720p" }`

### 5. Parse the response

```json
{
  "taskId": "minimax-T2V01-abc123def456",
  "status": "pending",
  "provider": "minimax",
  "model": "T2V-01",
  "message": "Video generation task created",
  "pollUrl": "/api/v1/llm/video-status/minimax-T2V01-abc123def456"
}
```

- Note the `taskId` — this is needed to check status later
- The initial status will be `"pending"` or `"processing"`

### 6. Tell the user the next step

After submitting, inform the user:
> Video generation started! Task ID: `<taskId>`
> Video generation typically takes 30 seconds to 5 minutes.
> Use `/oatda:oatda-video-status <taskId>` to check when your video is ready.

### 7. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 400 | Bad request / prompt too long | Keep prompt under 4000 chars |
| 429 | Rate limited | Wait and retry |
| 400 with content_policy | Content policy violation | Ask user to adjust description |

## Full Examples

### Bytedance Seedance (default)

User asks: "Generate a 5-second video of ocean waves at sunset"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "bytedance",
    "model": "seedance-1-5-pro-251215",
    "prompt": "Ocean waves crashing on a beach at sunset, golden hour lighting, cinematic",
    "model_params": {
      "ratio": "16:9",
      "duration": "5",
      "generate_audio": true,
      "camera_fixed": false
    }
  }'
```

### Seedance Image-to-Video (with first and last frame)

User asks: "Create a video transition between these two images"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "bytedance",
    "model": "seedance-1-5-pro-251215",
    "prompt": "Smooth transition from day to night",
    "model_params": {
      "ratio": "16:9",
      "first_frame_image": "https://example.com/daytime.jpg",
      "last_frame_image": "https://example.com/nighttime.jpg"
    }
  }'
```

### MiniMax with reference image

User asks: "Animate this image with MiniMax"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "minimax",
    "model": "T2V-01",
    "prompt": "The character starts walking forward slowly",
    "model_params": {
      "first_frame_image": "https://example.com/character.png",
      "resolution": "720P"
    }
  }'
```

### Google Veo

User asks: "Generate a cinematic video with Google Veo"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "google",
    "model": "veo-3.0-generate-preview",
    "prompt": "A drone shot flying over a misty mountain range at sunrise",
    "duration": 5,
    "aspectRatio": "16:9"
  }'
```

### xAI Grok Video

User asks: "Generate a video with xAI Grok"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "xai",
    "model": "grok-2-video",
    "prompt": "A futuristic city with flying cars and holographic billboards",
    "model_params": {
      "resolution": "720p"
    }
  }'
```

## Tips

- Always use `?async=true` in the URL — the API does not support synchronous video generation
- Video generation takes 30 seconds to 5+ minutes depending on model and complexity
- Always give the user the task ID and suggest `/oatda:oatda-video-status` to check progress
- **Use `list_models?type=video` to discover model-specific parameters before generating**
- **Use `model_params` for model-specific options (ratio, generate_audio, camera_fixed, etc.)**
- **For image-to-video**: Provide `first_frame_image` and optionally `last_frame_image` as public URLs
- Prompt maximum is 4000 characters
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-video-status` (required companion for checking results), `/oatda:oatda-list-models` for available video models
