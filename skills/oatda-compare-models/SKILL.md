---
name: oatda-compare-models
description: Use when the user wants to compare outputs from multiple LLM models side-by-side in a single request. Sends one prompt to multiple providers (OpenAI, Anthropic, Google, DeepSeek, etc.) in parallel via OATDA's /api/v1/compare endpoint and returns each model's response. Triggers on "compare models", "which model is best", "side-by-side LLM", "benchmark models", "gpt-5 vs claude", "evaluate multiple models".
---

# OATDA Compare Models

Send one prompt to multiple LLM providers in a single parallel request and get back each model's response. Perfect for benchmarking, picking the best model for a task, or evaluating quality / speed / cost tradeoffs.

## When to Use

Use this skill when the user wants to:
- Compare outputs from 2+ LLM models side-by-side
- Benchmark models on a specific prompt
- Pick the best model for a particular task before committing to one
- See how different providers (OpenAI, Anthropic, Google, DeepSeek, etc.) handle the same input

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
- The key resolution script and subsequent `curl` commands **must run in the same shell session**. Either run all commands in one session, or chain them (e.g., `export OATDA_API_KEY=... && curl ...`).

### 2. Determine models to compare

Ask the user (or infer from context) which models they want. If they don't specify, use this sensible default set:

```json
[
  {"provider": "openai", "modelId": "gpt-5"},
  {"provider": "anthropic", "modelId": "claude-sonnet-4-5-20250929"},
  {"provider": "google", "modelId": "gemini-3-pro-preview"},
  {"provider": "deepseek", "modelId": "deepseek-v4-pro"}
]
```

**Common aliases** (same mapping as `oatda-text-completion`):

| User says | Provider | Model ID |
|-----------|----------|----------|
| gpt-5 | openai | gpt-5 |
| gpt-4o | openai | gpt-4o |
| claude, sonnet | anthropic | claude-sonnet-4-5-20250929 |
| opus | anthropic | claude-opus-4-5-20251101 |
| gemini | google | gemini-3-pro-preview |
| gemini-2.5 | google | gemini-2.5-pro |
| deepseek | deepseek | deepseek-v4-pro |
| mistral | mistral | mistral-large-latest |
| grok | xai | grok-4-fast |
| qwen | alibaba | qwen3-max |
| kimi, moonshot | moonshot | kimi-k2.7-code |
| glm | zai | glm-5 |

**Limits**: minimum 1 model, maximum 8 models per request (configurable server-side as `max_compare_models`). Each entry needs `provider` + `modelId` — note the field name is **`modelId`** (not `model`).

### 3. Make the API call (non-stream)

For a single-shot comparison without streaming:

```bash
curl -s -X POST "https://oatda.com/api/v1/compare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "prompt": "<USER_PROMPT>",
    "models": [
      {"provider": "openai", "modelId": "gpt-5"},
      {"provider": "anthropic", "modelId": "claude-sonnet-4-5-20250929"},
      {"provider": "google", "modelId": "gemini-3-pro-preview"}
    ],
    "temperature": 0.7,
    "maxTokens": 1024,
    "stream": false
  }'
```

Replace `<USER_PROMPT>` with the user's prompt (JSON-escape special characters).

**Optional parameters**:
- `temperature`: 0 (deterministic) to 2 (creative). Default: 0.7
- `maxTokens`: Max tokens per model response. Default: provider/model limit
- `stream`: `true` for SSE stream (one event per model), `false` for batch JSON. Default: `true`

**Per-model messages override**: Each entry in `models` may include its own `messages` array (with `role`/`content`) and optional `service_tier` (`standard` | `flex` | `priority`). If omitted, the top-level `prompt` is used for all models.

### 4. Parse the response

Non-stream response (NDJSON-ish / batch JSON) contains one result per model. Typical shape:

```json
{
  "results": [
    {
      "provider": "openai",
      "modelId": "gpt-5",
      "success": true,
      "response": "GPT-5's answer...",
      "tokenUsage": {"prompt_tokens": 30, "completion_tokens": 120, "total_tokens": 150, "cost": 0.0035}
    },
    {
      "provider": "anthropic",
      "modelId": "claude-sonnet-4-5-20250929",
      "success": true,
      "response": "Claude's answer...",
      "tokenUsage": {"prompt_tokens": 30, "completion_tokens": 95, "total_tokens": 125, "cost": 0.0021}
    },
    {
      "provider": "google",
      "modelId": "gemini-3-pro-preview",
      "success": false,
      "error": "Model temporarily unavailable"
    }
  ]
}
```

If `stream: true`, the response is SSE: each model's output arrives as one or more `data:` events tagged with provider/modelId.

### 5. Present results side-by-side

Format the comparison so the user can scan it:

```
Comparison: "<prompt summary>"
─────────────────────────────────────────────────────

[GPT-5]  (cost: $0.0035, 150 tokens)
GPT-5's answer...

[Claude Sonnet 4.5]  (cost: $0.0021, 125 tokens)
Claude's answer...

[Gemini 3 Pro]  (failed: "Model temporarily unavailable")
```

Highlight the cheapest / fastest / best answer if the user asked for a recommendation.

### 6. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 400 | Invalid request (bad modelId, empty models array) | Check field names (`modelId` not `model`), verify providers are valid |
| 401 | Invalid API key | Tell user to check their key at https://oatda.com/dashboard/api-keys |
| 402 | Insufficient credits | Tell user to top up at https://oatda.com/dashboard/credits (or run `oatda-check-balance` first) |
| 422 | Too many models (max 8) | Reduce `models` array length |
| 429 | Rate limited | Wait 5 seconds and retry once |

Individual model failures inside a `results[].success: false` entry are NOT API errors — the API call succeeded, that specific model just failed. Show the failure inline with the others.

## Full Example

User asks: "Compare how GPT-5, Claude, and Gemini answer 'Explain recursion in one sentence'"

```bash
curl -s -X POST "https://oatda.com/api/v1/compare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "prompt": "Explain recursion in one sentence.",
    "models": [
      {"provider": "openai", "modelId": "gpt-5"},
      {"provider": "anthropic", "modelId": "claude-sonnet-4-5-20250929"},
      {"provider": "google", "modelId": "gemini-3-pro-preview"}
    ],
    "temperature": 0.7,
    "maxTokens": 256,
    "stream": false
  }'
```

## Tips

- **Field name is `modelId`**, not `model` (the compare endpoint uses a stricter schema than `/api/v1/llm`).
- **Max 8 models** per request (server-configurable `max_compare_models`).
- **Cost accumulates per model**: a 4-model comparison costs roughly the sum of the 4 individual calls. Run `oatda-check-balance` first if budget is tight.
- Each model can fail independently — `results[].success` distinguishes successes from failures.
- For deeper discovery (parameters, capabilities), run `oatda-list-models` first.
- For a single-model call, use `oatda-text-completion` instead — it's simpler and returns direct cost.
- NEVER expose the full API key in output — redact all but the first 8 characters.
- Related skills: `/oatda:oatda-text-completion`, `/oatda:oatda-list-models`, `/oatda:oatda-check-balance`.
