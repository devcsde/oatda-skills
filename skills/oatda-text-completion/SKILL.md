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
# Check env var first; if empty, auto-load from credentials file
if [[ -z "$OATDA_API_KEY" ]]; then
  export OATDA_API_KEY=$(cat ~/.oatda/credentials.json 2>/dev/null | jq -r '.profiles[.defaultProfile].apiKey' 2>/dev/null)
fi

# Verify key exists (show first 8 chars only)
echo "${OATDA_API_KEY:0:8}"
```

If the output is empty or `null`, stop and ask the user to configure their API key.

**IMPORTANT**:
- Never print the full API key. Only check its existence or show the first 8 characters for verification.
- The key resolution script and subsequent `curl` commands **must run in the same shell session**. Each separate bash/terminal invocation starts with an isolated environment where previously exported variables are lost. Either run all commands in one session, or chain them (e.g., `export OATDA_API_KEY=... && curl ...`).

### 2. Determine the model

Parse the user's request for a model. Map common aliases to `provider/model` format:

| User says | Provider | Model |
|-----------|----------|-------|
| gpt-4o | openai | gpt-4o |
| gpt-4o-mini | openai | gpt-4o-mini |
| gpt-5 | openai | gpt-5 |
| gpt-5-mini | openai | gpt-5-mini |
| o1 | openai | o1 |
| o3 | openai | o3 |
| claude, sonnet | anthropic | claude-sonnet-4-5-20250929 |
| haiku | anthropic | claude-haiku-4-5-20251001 |
| opus | anthropic | claude-opus-4-5-20251101 |
| gemini | google | gemini-3-pro-preview |
| gemini-2.5 | google | gemini-2.5-pro |
| deepseek | deepseek | deepseek-v4-pro |
| mistral | mistral | mistral-large-latest |
| grok | xai | grok-4-fast |
| grok-4 | xai | grok-4-1-fast-reasoning |
| qwen | alibaba | qwen3-max |
| kimi, moonshot | moonshot | kimi-k2.7-code |
| glm | zai | glm-5 |

**Default**: `openai` / `gpt-4o` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/gpt-4o`), split on `/` to get the separate `provider` and `model` values.

> ⚠️ Models update frequently. If a model ID fails, query `/oatda:oatda-list-models` or `GET https://oatda.com/api/v1/models` for the latest available models.

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
    "model": "claude-sonnet-4-5-20250929",
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
