---
name: oatda-list-models
description: Use when the user wants to list available AI models from OATDA's 10+ providers. Filter by type (chat, image, video) or by provider name.
---

# OATDA List Models

List all available AI models from OATDA's providers with optional filtering.

## When to Use

Use this skill when the user wants to:
- See what models are available through OATDA
- Find the right model for a specific task (chat, image, video)
- Know which providers are supported
- Filter models by type or provider

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

### 2. Determine filters

Parse the user's request for optional filters:
- **type**: `chat`, `image`, or `video` (omit for all types)
- **provider**: Provider name like `openai`, `anthropic`, `google`, etc.

### 3. Make the API call

**List all models** (no filters):

```bash
curl -s -X GET "https://oatda.com/api/v1/models" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Filter by type**:

```bash
curl -s -X GET "https://oatda.com/api/v1/models?type=chat" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Filter by provider**:

```bash
curl -s -X GET "https://oatda.com/api/v1/models?provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Combine filters**:

```bash
curl -s -X GET "https://oatda.com/api/v1/models?type=image&provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

### 4. Parse the response

The API returns an OpenAI-compatible format. The exact structure may include:

```json
{
  "total": 42,
  "filter": {
    "type": "all",
    "provider": null
  },
  "chatModels": [
    {"id": "openai/gpt-4o", "provider": "openai", "model": "gpt-4o", "displayName": "GPT-4o"},
    {"id": "anthropic/claude-3-5-sonnet", "provider": "anthropic", "model": "claude-3-5-sonnet", "displayName": "Claude 3.5 Sonnet"}
  ],
  "imageModels": [
    {"id": "openai/dall-e-3", "provider": "openai", "model": "dall-e-3", "displayName": "DALL-E 3"}
  ],
  "videoModels": [
    {"id": "minimax/T2V-01", "provider": "minimax", "model": "T2V-01", "displayName": "MiniMax T2V-01"}
  ]
}
```

### 5. Present results

Format the models in a readable way, organized by category:

**Chat Models** (N total):
- `openai/gpt-4o` — GPT-4o
- `anthropic/claude-3-5-sonnet` — Claude 3.5 Sonnet
- ...

**Image Models** (N total):
- `openai/dall-e-3` — DALL-E 3
- ...

**Video Models** (N total):
- `minimax/T2V-01` — MiniMax T2V-01
- ...

If the response format differs (e.g., flat `data` array with `id` and `object` fields), adapt accordingly and group by provider or capability.

### 6. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 429 | Rate limited | Wait and retry |

## Full Example

User asks: "What OpenAI models are available?"

```bash
curl -s -X GET "https://oatda.com/api/v1/models?provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

User asks: "Show me all image generation models"

```bash
curl -s -X GET "https://oatda.com/api/v1/models?type=image" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

## Tips

- This is a GET request with query parameters, not POST
- Use this skill to help users find the right model for other OATDA skills
- The `id` field (e.g., `openai/gpt-4o`) is the model identifier used in other skills
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-text-completion`, `/oatda:oatda-generate-image`, `/oatda:oatda-generate-video`, `/oatda:oatda-vision-analysis`
