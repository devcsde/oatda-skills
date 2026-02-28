---
name: oatda-text-completion
description: Use when the user wants to generate text using OATDA's unified LLM API. Supports 10+ providers including OpenAI, Anthropic, Google, Deepseek, Mistral, xAI, Alibaba, MiniMax, ZAI, and Moonshot.
---

# OATDA Text Completion

Generate text from 10+ LLM providers through OATDA's unified API endpoint.

## When to Use

Use this skill when the user wants to:
- Generate text using a specific LLM provider through the OATDA API
- Send a prompt to OpenAI, Anthropic, Google, Deepseek, Mistral, xAI, or other providers via OATDA
- Compare outputs across different models using a single API
- Use a model by alias (e.g., "gpt-4o", "claude", "gemini")

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
# Check env var first
echo "$OATDA_API_KEY" | head -c 8
```

If empty, try reading from config file:

```bash
cat ~/.oatda/credentials.json 2>/dev/null | jq -r '.profiles[.defaultProfile].apiKey' 2>/dev/null | head -c 8
```

If both are empty, stop and ask the user to configure their API key.

**IMPORTANT**: Never print the full API key. Only check its existence or show the first 8 characters for verification.

### 2. Determine the model

Parse the user's request for a model. Map common aliases to `provider/model` format:

| User says | Provider | Model |
|-----------|----------|-------|
| gpt-4o | openai | gpt-4o |
| gpt-4o-mini | openai | gpt-4o-mini |
| o1 | openai | o1 |
| claude, sonnet | anthropic | claude-3-5-sonnet |
| haiku | anthropic | claude-3-5-haiku |
| opus | anthropic | claude-3-opus |
| gemini | google | gemini-2.0-flash |
| gemini-1.5 | google | gemini-1.5-pro |
| deepseek | deepseek | deepseek-chat |
| mistral | mistral | mistral-large |
| grok | xai | grok-2 |
| qwen | alibaba | qwen-max |

**Default**: `openai` / `gpt-4o` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/gpt-4o`), split on `/` to get the separate `provider` and `model` values.

### 3. Make the API call

```bash
curl -s -X POST "https://oatda.com/api/v1/llm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "<PROVIDER>",
    "model": "<MODEL>",
    "prompt": "<USER_PROMPT>",
    "temperature": 0.7,
    "maxTokens": 4096
  }'
```

Replace `<PROVIDER>`, `<MODEL>`, and `<USER_PROMPT>` with actual values. Escape any special characters in the prompt for JSON.

**Optional parameters**:
- `temperature`: 0 (deterministic) to 2 (creative). Default: 0.7
- `maxTokens`: Max tokens to generate. Default: 4096
- `stream`: Set to `true` for streaming (not recommended via curl)

### 4. Parse the response

The API returns JSON like:

```json
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4o",
  "response": "The generated text content...",
  "tokenUsage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175,
    "cost": 0.001375
  }
}
```

- Present the `response` field to the user
- Optionally mention token usage and cost from `tokenUsage`

### 5. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key at https://oatda.com/dashboard/api-keys |
| 402 | Insufficient credits | Tell user to check balance at https://oatda.com/dashboard/usage |
| 429 | Rate limited | Wait 5 seconds and retry once |
| 400 | Bad request / model not found | Check model format, suggest using `/oatda:oatda-list-models` |

## Full Example

User asks: "Write a haiku about code using claude"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "anthropic",
    "model": "claude-3-5-sonnet",
    "prompt": "Write a haiku about code",
    "temperature": 0.7,
    "maxTokens": 256
  }'
```

## Tips

- The API expects `prompt` as a plain string, NOT a `messages` array
- Split `provider/model` into separate JSON fields: `"provider": "openai", "model": "gpt-4o"`
- For long-form content, increase `maxTokens` (max: 128000 for some models)
- Temperature 0 = deterministic output, 2 = maximum creativity
- NEVER expose the full API key in output — redact all but the first 8 characters
- If the API returns an error JSON with `error.message`, show that message to the user
- Related skills: `/oatda:oatda-list-models` to see available models, `/oatda:oatda-vision-analysis` for image analysis
