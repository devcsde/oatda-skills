# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Changed

- **README speech example:** `openai/tts-1` → `openai/gpt-4o-mini-tts` (deprecated models removed from catalog); note to prefer `list_models type=audio` first.

## [1.3.1] — 2026-07-17

### Changed

- **`oatda-generate-speech` MCP contract:** MCP `generate_speech` now returns a short-lived signed `AUDIO_URL` (`?exp=&sig=`, curl without login) plus `structuredContent.download_url` — not MCP `AudioContent` / base64 blocks and not “no server storage”. HTTP `/api/v1/llm/speech` still returns raw bytes via `curl --output`.
- **`oatda-vision-analysis`** canonical endpoint updated from `/api/v1/llm/image` to `/api/v1/llm` (same body, same response). The `/api/v1/llm/image` URL is now a deprecated alias that forwards to the canonical handler with the same payload — existing curl commands keep working, but new integrations should target `/api/v1/llm`. README API table reflects the canonical URL.
- `package.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / README badge synchronized at `1.3.1`.

## [1.3.0] — 2026-06-22

### Added

- **`oatda-compare-models`** skill: benchmark multiple LLM models (GPT-5, Claude Sonnet 4.5, Gemini 3 Pro, etc.) side-by-side in a single parallel request via `POST /api/v1/compare`. Returns each model's response, token usage, and cost. Perfect for "which model is best for X?" or A/B evaluation use cases. Documents the stricter `modelId` schema (not `model`), max-8-models limit, and per-model-failure semantics.
- **`oatda-check-balance`** skill: `GET /api/v1/user/credits` returns current balance, total usage (`usageSum`), and actionable remaining budget (`actualBalance`). Useful before expensive image/video/long-LLM calls. Documents the `balance` vs `actualBalance` distinction and the €1 minimum top-up.

### Changed

- `package.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` version stamps synchronized at `1.3.0`.
- `package.json` keywords expanded with `benchmark`, `compare-models`, `balance`, `credits`.
- Plugin descriptions updated to mention model comparison and balance checking.

## [1.2.0] — 2026-06-22

### Changed

- **Model mappings refreshed across all skills** (verified against live `llm_prices` catalog): Claude aliases now resolve to `claude-sonnet-4-5-20250929` / `claude-haiku-4-5-20251001` / `claude-opus-4-5-20251101`; Gemini to `gemini-3-pro-preview` (with `gemini-2.5-pro` fallback); DeepSeek to `deepseek-v4-pro`; Mistral to `mistral-large-latest`; Grok to `grok-4-fast` / `grok-4-1-fast-reasoning`; Qwen to `qwen3-max`; new Kimi (`kimi-k2.7-code`) and GLM (`glm-5`) aliases added; deprecated `claude-3-5-*`, `claude-3-opus`, `gemini-1.5-pro`, `gemini-2.0-flash`, `grok-2`, `qwen-max`, `deepseek-chat`, `mistral-large` removed.
- **Video model mappings refreshed**: MiniMax `T2V-01` → `T2V-01-Director`, Google `veo-3.0-generate-preview` → `veo-3.0-generate-001`, Alibaba `wan2.5-t2v-preview` → `wan2.6-t2v`, new `cogvideox-3` (ZAI).
- **All skills now carry a "models update frequently" footnote** that points users to `oatda-list-models` for the latest catalog.
- `package.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` version stamps synchronized at `1.2.0` (previous: 1.1.1 / 1.1.0 / 1.0.1 — drift fixed).
- `package.json` keywords expanded with `ai-gateway`, `deepseek`, `mistral`, `grok`, `moonshot`, `kimi`, `minimax`, `qwen`, `alibaba`, `bytedance`, `glm`, `zai`, `text-to-speech`, `image-generation`, `video-generation`, `vision`, `unified-api` for better npm/GitHub discovery.

### Added

- Cross-reference to OpenClaw skills repo (`github.com/devcsde/oatda-openclaw-skills`) and to OATDA's `/llms.txt` agent-discovery endpoint (`https://oatda.com/llms.txt`) is now linked from the OATDA main repo `/llms.txt`.

## [1.1.1] — earlier

- Version stamp bump; audio SKILL.md enhancements.

## [1.1.0] — earlier

- Audio skills (TTS, transcription, translation) added.

## [1.0.1] — earlier

- Marketplace configuration; API key handling instructions.
