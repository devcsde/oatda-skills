---
name: oatda-vision-analysis
description: Use when the user wants to analyze images using vision-capable AI models through OATDA's unified API. Supports OpenAI GPT-4o, Anthropic Claude, and Google Gemini vision models.
---

# OATDA Vision Analysis

Analyze images using vision-capable AI models through OATDA's unified API endpoint.

## When to Use

Use this skill when the user wants to:
- Analyze or describe an image via OATDA
- Extract text (OCR) from an image using a vision model
- Understand diagrams, charts, or screenshots
- Get AI-powered image descriptions from OpenAI, Anthropic, or Google

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

Map common aliases to `provider/model` format:

| User says | Provider | Model |
|-----------|----------|-------|
| gpt-4o (default) | openai | gpt-4o |
| gpt-4o-mini | openai | gpt-4o-mini |
| claude, sonnet | anthropic | claude-3-5-sonnet |
| gemini | google | gemini-2.0-flash |
| gemini-1.5 | google | gemini-1.5-pro |

**Default**: `openai` / `gpt-4o` if no model specified.

### 3. Validate the image URL

- Only accept `https://` URLs or `data:image/` base64 data URIs
- **Reject** `http://` URLs, local file paths, and internal IPs (localhost, 127.0.0.1, 169.254.x.x)
- If the user provides a local file, suggest they convert it to base64 first

### 4. Make the API call

The vision endpoint uses a `contents` array (NOT a simple `prompt` string):

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "<PROVIDER>",
    "model": "<MODEL>",
    "contents": [
      {
        "type": "text",
        "text": "<ANALYSIS_PROMPT>"
      },
      {
        "type": "image",
        "image": {
          "url": "<IMAGE_URL>",
          "detail": "auto"
        }
      }
    ]
  }'
```

Replace `<PROVIDER>`, `<MODEL>`, `<ANALYSIS_PROMPT>`, and `<IMAGE_URL>` with actual values.

**CRITICAL**: This endpoint is `/api/v1/llm/image` (NOT `/api/v1/llm/vision`). The request body uses `contents` array, NOT a `prompt` + `imageUrl` structure.

**Optional parameters** (add to body):
- `temperature`: 0-2, default 0.7
- `maxTokens`: Max response tokens

**Image detail levels** (in the `image.detail` field):
- `"auto"` — Let the model decide (default)
- `"low"` — Faster, cheaper, less detail
- `"high"` — More detail, higher cost

### 5. Parse the response

```json
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4o",
  "response": "The image shows a sunset over...",
  "usage": {
    "promptTokens": 800,
    "completionTokens": 200,
    "totalTokens": 1000
  },
  "costs": {
    "inputCost": 0.004,
    "outputCost": 0.006,
    "totalCost": 0.01,
    "currency": "USD"
  }
}
```

Present the `response` field to the user. Optionally mention token usage and cost.

### 6. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 400 | Bad request | Check image URL is valid HTTPS, model supports vision |
| 429 | Rate limited | Wait 5 seconds and retry once |

## Full Example

User asks: "Describe this image: https://example.com/photo.jpg"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "contents": [
      {"type": "text", "text": "Describe this image in detail"},
      {"type": "image", "image": {"url": "https://example.com/photo.jpg", "detail": "auto"}}
    ]
  }'
```

## Tips

- The endpoint is `/api/v1/llm/image` — do NOT confuse with `/api/v1/llm/generate-image` (that's for generation)
- The body uses `contents` array format, NOT a simple prompt string
- Only HTTPS image URLs are accepted — no HTTP, no local file paths
- Image tokens are included in the prompt token count and affect cost
- For OCR tasks, use `"detail": "high"` for better text recognition
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-generate-image` for creating images, `/oatda:oatda-list-models` for available vision models
