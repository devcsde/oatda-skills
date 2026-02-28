# OATDA Skills for Claude Code

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/release/devcsde/oatda-skills)](https://github.com/devcsde/oatda-skills/releases)

OATDA (One API To Direct All) provides unified access to 10+ LLM providers through a single API. This repository contains Claude Code skills for easy integration.

## Supported Providers

| Provider | Chat | Image | Video |
|----------|------|-------|-------|
| OpenAI | ✅ | ✅ (DALL-E) | ✅ |
| Anthropic | ✅ | - | - |
| Google | ✅ | ✅ (Imagen) | ✅ (Veo) |
| Deepseek | ✅ | - | - |
| Mistral | ✅ | - | - |
| xAI | ✅ | - | - |
| Alibaba | ✅ | - | ✅ (Wan) |
| MiniMax | ✅ | ✅ | ✅ |
| ZAI | ✅ | - | ✅ |
| Moonshot | ✅ | - | - |

## Installation

### Option 1: Install All Skills

```bash
npx @claude-code/skills install devcsde/oatda-skills
```

### Option 2: Install Individual Skills

```bash
# Text completion (chat)
npx @claude-code/skills install devcsde/oatda-skills#skills/oatda-text-completion

# Image generation
npx @claude-code/skills install devcsde/oatda-skills#skills/oatda-generate-image

# Video generation
npx @claude-code/skills install devcsde/oatda-skills#skills/oatda-generate-video
```

## Configuration

Set your OATDA API key:

```bash
export OATDA_API_KEY=your_api_key_here
```

Or create a config file at `~/.oatda/credentials.json`:

```json
{
  "version": 1,
  "defaultProfile": "default",
  "profiles": {
    "default": {
      "name": "default",
      "apiKey": "your_api_key_here",
      "baseUrl": "https://oatda.com",
      "createdAt": 1234567890,
      "lastUsed": 1234567890
    }
  }
}
```

**Important**: Set secure permissions on the config file:

```bash
chmod 600 ~/.oatda/credentials.json
```

## Available Skills

| Skill | Description | MCP Equivalent |
|-------|-------------|----------------|
| `oatda-text-completion` | Text generation from 10+ providers with streaming | `chat_completion` |
| `oatda-vision-analysis` | Image analysis with vision models | `vision_analysis` |
| `oatda-generate-image` | Image generation (DALL-E, Imagen, Qwen, MiniMax) | `generate_image` |
| `oatda-generate-video` | Video generation (async, returns task ID) | `generate_video` |
| `oatda-video-status` | Check async video generation status | `get_video_status` |
| `oatda-list-models` | List available models with filtering | `list_models` |

## Usage Examples

### Text Completion

```
> Write a haiku about code using gpt-4o
```

The skill will use OpenAI's GPT-4o model to generate the haiku.

### Image Generation

```
> Generate an image of a cyberpunk city at night using DALL-E 3
```

The skill will create the image and return the URL.

### Video Generation

```
> Create a 5-second video of ocean waves at sunset using Google Veo
```

The skill will start video generation and return a task ID. Check status with:

```
> Check the video generation status for task [task_id]
```

### Model Selection

```
> Compare responses from gpt-4o and claude-3-5-sonnet on "What is the meaning of life?"
```

The skill can generate text from any supported model using the `provider/model` format.

### Vision Analysis

```
> Analyze this image: [URL] and describe what you see
```

The skill will use a vision model to analyze the image.

## MCP vs Skills

Choose your integration method:

| Feature | MCP Server | Skills |
|---------|-----------|--------|
| **Installation** | Single server endpoint | Individual skill installation |
| **Auth** | Per-session API key | Global API key config |
| **State** | Session-based | Stateless |
| **Use Case** | Production integrations | Development workflows |

**Use MCP when**:
- Building production applications
- Need session management
- Want unified protocol

**Use Skills when**:
- Developing with Claude Code
- Want quick integration
- Prefer per-skill control

## API Key Security

This repository implements multiple layers of API key protection:

1. **System Keyring** (most secure): Store keys encrypted in OS keychain
2. **Config File** (recommended): `~/.oatda/credentials.json` with `0600` permissions
3. **Environment Variable** (dev only): `OATDA_API_KEY` for quick testing
4. **Profile Support**: Multiple named profiles for different environments

See [API Key Security](docs/plans/2026-02-28-oatda-skills-api-key-security.md) for detailed security guidelines.

## Getting an API Key

1. Visit [oatda.com](https://oatda.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Set the key in your environment or config file

## Support

- **Issues**: [GitHub Issues](https://github.com/devcsde/oatda-skills/issues)
- **Documentation**: [OATDA Docs](https://docs.oatda.com)
- **API Reference**: [OATDA API Reference](https://oatda.com/api/docs)

## Development

```bash
# Clone repository
git clone https://github.com/devcsde/oatda-skills.git
cd oatda-skills

# Install dependencies (if adding TypeScript tooling)
npm install

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
