# OATDA Skills Plugin for Claude Code

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-blueviolet)](https://code.claude.com/docs/en/plugins)

[OATDA](https://oatda.com) (One API To Direct All) provides unified access to 10+ LLM providers through a single API. This [Claude Code plugin](https://code.claude.com/docs/en/plugins) adds skills for text generation, vision analysis, image generation, and video generation.

## Supported Providers

| Provider | Chat | Image | Video |
|----------|------|-------|-------|
| OpenAI | ✅ | ✅ (DALL-E, GPT-Image) | ✅ (Sora) |
| Anthropic | ✅ | - | - |
| Google | ✅ | ✅ (Imagen) | ✅ (Veo) |
| Deepseek | ✅ | - | - |
| Mistral | ✅ | - | - |
| xAI | ✅ | ✅ | - |
| Alibaba | ✅ | ✅ (Qwen) | ✅ (Wan) |
| MiniMax | ✅ | ✅ | ✅ (T2V-01) |
| ZAI | ✅ | - | ✅ |
| Moonshot | ✅ | - | - |

## Installation

### Option 1: Load from local directory (development)

```bash
git clone https://github.com/devcsde/oatda-skills.git
claude --plugin-dir ./oatda-skills
```

### Option 2: Install from marketplace

```bash
# Inside Claude Code:
/plugin install devcsde/oatda-skills
```

## Configuration

Set your OATDA API key using one of these methods:

### Environment variable (quickest)

```bash
export OATDA_API_KEY=your_api_key_here
```

### Config file (recommended)

Run the setup script:

```bash
bash scripts/setup-credentials.sh
```

Or manually create `~/.oatda/credentials.json`:

```json
{
  "version": 1,
  "defaultProfile": "default",
  "profiles": {
    "default": {
      "name": "default",
      "apiKey": "your_api_key_here",
      "createdAt": 1234567890,
      "lastUsed": 1234567890
    }
  }
}
```

**Important**: Set secure permissions:

```bash
chmod 600 ~/.oatda/credentials.json
```

## Available Skills

| Skill | Invocation | Description |
|-------|------------|-------------|
| Text Completion | `/oatda:oatda-text-completion` | Generate text using any of 10+ LLM providers |
| Vision Analysis | `/oatda:oatda-vision-analysis` | Analyze images using vision-capable models |
| Image Generation | `/oatda:oatda-generate-image` | Generate images from text descriptions |
| Video Generation | `/oatda:oatda-generate-video` | Generate videos (async, returns task ID) |
| Video Status | `/oatda:oatda-video-status` | Check video generation task status |
| List Models | `/oatda:oatda-list-models` | List available models with filtering |

Claude will also invoke these skills automatically when relevant to your conversation.

## Usage Examples

### Text Generation

```
Write a haiku about code using claude
```

```
/oatda:oatda-text-completion Explain quantum computing using gpt-4o
```

### Vision Analysis

```
Analyze this image: https://example.com/photo.jpg
```

### Image Generation

```
/oatda:oatda-generate-image A cyberpunk city at night, neon lights, rain
```

### Video Generation

```
/oatda:oatda-generate-video Ocean waves crashing on a beach at sunset
```

Then check status:

```
/oatda:oatda-video-status <task-id>
```

### List Models

```
/oatda:oatda-list-models
```

```
What OpenAI models are available through OATDA?
```

## Plugin Structure

```
oatda-skills/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── oatda-text-completion/
│   │   └── SKILL.md         # Text generation skill
│   ├── oatda-vision-analysis/
│   │   └── SKILL.md         # Image analysis skill
│   ├── oatda-generate-image/
│   │   └── SKILL.md         # Image generation skill
│   ├── oatda-generate-video/
│   │   └── SKILL.md         # Video generation skill
│   ├── oatda-video-status/
│   │   └── SKILL.md         # Video status checking skill
│   └── oatda-list-models/
│       └── SKILL.md         # Model listing skill
├── scripts/
│   └── setup-credentials.sh # API key setup helper
├── README.md
└── LICENSE
```

## API Reference

All skills communicate with the OATDA REST API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/llm` | POST | Text/chat completion |
| `/api/v1/llm/image` | POST | Vision analysis |
| `/api/v1/llm/generate-image` | POST | Image generation |
| `/api/v1/llm/generate-video?async=true` | POST | Video generation |
| `/api/v1/llm/video-status/{taskId}` | GET | Video status |
| `/api/v1/models` | GET | List models |

Authentication: `Authorization: Bearer <api_key>` header on all requests.

## Getting an API Key

1. Visit [oatda.com](https://oatda.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Generate New Key**
5. Store it securely (see Configuration above)

## Security

- API keys are never logged or included in skill output
- Config file requires `chmod 600` permissions
- Only HTTPS image URLs are accepted (no HTTP, no local files)
- Internal/private IPs are rejected (localhost, 169.254.x.x, etc.)

## License

[Apache 2.0](LICENSE)
