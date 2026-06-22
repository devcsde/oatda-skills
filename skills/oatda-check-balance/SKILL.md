---
name: oatda-check-balance
description: Use when the user wants to check their OATDA account balance, credit usage, or remaining budget before running an expensive AI call. Returns current balance, total usage, and available balance. Triggers on phrases like "check my OATDA credits", "how much budget do I have left", "verify OATDA balance", "am I out of credits", "check usage".
---

# OATDA Check Balance

Check the current OATDA account balance, total usage, and available balance. Useful before expensive image/video/LLM calls to confirm the user has enough credits.

## When to Use

Use this skill when the user wants to:
- Check current OATDA credits / balance
- See total usage spent so far
- Verify there is enough budget before running a costly call (image, video, long LLM run)
- Diagnose why an OATDA call returned `402 Insufficient credits`

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

### 2. Make the API call

```bash
curl -s -X GET "https://oatda.com/api/v1/user/credits" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

### 3. Parse the response

The API returns JSON:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "balance": 25.00,
  "updatedAt": "2026-06-22T14:30:00.000Z",
  "usageSum": 7.42,
  "actualBalance": 17.58
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `balance` | number | Top-up total (credits ever purchased) |
| `usageSum` | number | Total amount consumed by API calls so far |
| `actualBalance` | number | **What the user can still spend** = `balance - usageSum` |
| `updatedAt` | ISO timestamp | Last time the balance row was refreshed |

The **actionable number** for "how much budget do I have left?" is `actualBalance`.

### 4. Present results to the user

```
OATDA Balance
─────────────────────────────
Available:  €17.58
Spent:      €7.42
Top-up:     €25.00
```

If `actualBalance` is `0` or negative, tell the user to top up at https://oatda.com/dashboard/credits (minimum €1, credit card or PayPal).

### 5. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid or missing API key | Tell user to check their key at https://oatda.com/dashboard/api-keys |
| 403 | Authenticated but not allowed | User account may be suspended — contact support |
| 500 | Database error | Retry once; if persists, report |

## Full Example

User asks: "Do I have enough credits for a 10-second video?"

```bash
# Step 1: Check balance first
curl -s -X GET "https://oatda.com/api/v1/user/credits" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

If `actualBalance >= ~€0.50` (rough Veo / Seedance price for 10s), proceed with `oatda-generate-video`. Otherwise tell the user to top up first.

## Tips

- This is a GET request — no body needed.
- Always check balance before expensive calls (video generation, batch image generation, long-running streaming).
- `actualBalance` is the canonical "remaining budget" number — `balance` alone is misleading.
- Minimum top-up is €1. Methods: credit card, PayPal.
- NEVER expose the full API key in output — redact all but the first 8 characters.
- Related skills: `/oatda:oatda-list-models` (check pricing), `/oatda:oatda-text-completion`, `/oatda:oatda-generate-image`, `/oatda:oatda-generate-video`.
