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
echo "$OATDA_API_KEY" | head -c 8
```

If empty, try config file:

```bash
cat ~/.oatda/credentials.json 2>/dev/null | jq -r '.profiles[.defaultProfile].apiKey' 2>/dev/null | head -c 8
```

**IMPORTANT**: Never print the full API key.

### 2. Determine the model

Map common aliases:

| User says | Provider | Model |
|-----------|----------|-------|
| minimax, t2v (default) | minimax | T2V-01 |
| veo, google veo | google | veo-3.0-generate-preview |
| wan, alibaba | alibaba | wan-t2v |
| sora | openai | sora |

**Default**: `minimax` / `T2V-01` if no model specified.

### 3. Make the API call

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

### 4. Parse the response

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

### 5. Tell the user the next step

After submitting, inform the user:
> Video generation started! Task ID: `<taskId>`
> Video generation typically takes 30 seconds to 5 minutes.
> Use `/oatda:oatda-video-status <taskId>` to check when your video is ready.

### 6. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 400 | Bad request / prompt too long | Keep prompt under 4000 chars |
| 429 | Rate limited | Wait and retry |
| 400 with content_policy | Content policy violation | Ask user to adjust description |

## Full Example

User asks: "Generate a 5-second video of ocean waves at sunset using Google Veo"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-video?async=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "google",
    "model": "veo-3.0-generate-preview",
    "prompt": "Ocean waves crashing on a beach at sunset, golden hour lighting, cinematic",
    "duration": 5
  }'
```

## Tips

- Always use `?async=true` in the URL — the API does not support synchronous video generation
- Video generation takes 30 seconds to 5+ minutes depending on model and complexity
- Always give the user the task ID and suggest `/oatda:oatda-video-status` to check progress
- Prompt maximum is 4000 characters
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-video-status` (required companion for checking results), `/oatda:oatda-list-models` for available video models
