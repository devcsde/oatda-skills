# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

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
