---
name: oatda-text-completion
description: Generate text using any of OATDA's 13+ LLM providers (OpenAI, Anthropic, Google, Deepseek, Mistral, xAI, Alibaba, Chutes, MiniMax, ZAI, Groq, Moonshot, Baseten)
version: 1.0.0
author: OATDA Team
license: Apache-2.0
tags: [llm, text-generation, chat, completion, openai, anthropic, google]
homepage: https://github.com/devcsde/oatda-skills
---

# OATDA Text Completion

Generate text using any of OATDA's 13+ LLM providers through a unified interface.

## Supported Providers

- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo, o1
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro
- **Deepseek**: Deepseek Chat, Deepseek Coder
- **Mistral**: Mistral Large, Mistral 7B, Mixtral 8x7B
- **xAI**: Grok 2, Grok Beta
- **Alibaba**: Qwen Max, Qwen Plus, Qwen Turbo
- **MiniMax**: MiniMax Text-01
- **ZAI**: ZAI-7B, ZAI-13B
- **Groq**: Llama 3.3 70B, Mixtral 8x7B
- **Moonshot**: Moonshot-v1-8k, Moonshot-v1-32k
- **Baseten**: Various hosted models

## Setup

1. Install this skill
2. Set your OATDA API key: `export OATDA_API_KEY=your_key_here`
3. Use the skill in your prompts

## Configuration

**Environment Variable** (quickest for development):
```bash
export OATDA_API_KEY=your_api_key_here
```

**Config File** (recommended for production):
```json
// ~/.oatda/credentials.json
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

**Secure the config file**:
```bash
chmod 600 ~/.oatda/credentials.json
```

## Usage

Invoke this skill when:
- You need text generation from any LLM provider
- You want to compare outputs from different models
- You need streaming responses for long-form content
- You want to use specific models (GPT-4o, Claude, etc.)

### Examples

```
> Write a haiku about code using gpt-4o
```
Uses OpenAI's GPT-4o model.

```
> Explain quantum computing to a 5-year-old using claude-3-5-sonnet
```
Uses Anthropic's Claude 3.5 Sonnet.

```
> Compare responses from gpt-4o and claude-3-5-sonnet on "What is the meaning of life?"
```
Generates responses from both models for comparison.

```
> Write a product description for a smart coffee mug using gemini-2.0-flash
```
Uses Google's Gemini 2.0 Flash.

```
> Generate code for a binary search tree in Python, with explanations
```
Uses default model for code generation.

### Model Selection

Specify models using the `provider/model` format:

| Provider | Model ID | Best For |
|----------|----------|----------|
| OpenAI | `openai/gpt-4o` | General purpose, multimodal |
| OpenAI | `openai/gpt-4o-mini` | Fast, cost-effective |
| OpenAI | `openai/o1` | Complex reasoning |
| Anthropic | `anthropic/claude-3-5-sonnet` | Long context, nuanced |
| Anthropic | `anthropic/claude-3-5-haiku` | Fast, compact |
| Google | `google/gemini-2.0-flash` | Speed, cost |
| Google | `google/gemini-1.5-pro` | Long context |
| Deepseek | `deepseek/deepseek-chat` | Coding, reasoning |

## Parameters

When invoking this skill, you can specify:

- **model**: Model identifier (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet")
- **temperature**: Sampling temperature (0-2, lower = more focused, higher = more creative)
- **max_tokens**: Maximum tokens to generate
- **stream**: Enable streaming response (for long-form content)

## Streaming Support

For long-form content, streaming provides real-time feedback:

```
> Write a 2000-word article about the history of coffee, using streaming
```

## Cost Tracking

The skill tracks:
- Prompt tokens used
- Completion tokens generated
- Total cost in USD
- Cost breakdown per provider

## Troubleshooting

**"No API key found"**
- Set `OATDA_API_KEY` environment variable
- Or create `~/.oatda/credentials.json` file

**"Invalid API key"**
- Verify your API key at https://oatda.com/dashboard/api-keys
- Ensure the key starts with `oatda_` or `sk_`

**"Model not found"**
- Check available models: use `oatda-list-models` skill
- Verify model format: `provider/model` (e.g., `openai/gpt-4o`)

**"Monthly cap exceeded"**
- Check your usage at https://oatda.com/dashboard/usage
- Wait for monthly reset or upgrade your plan

## Getting an API Key

1. Visit [oatda.com](https://oatda.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Generate New Key**
5. Copy and securely store your key

## Related Skills

- `oatda-vision-analysis` - Analyze images with vision models
- `oatda-generate-image` - Generate images
- `oatda-generate-video` - Generate videos
- `oatda-list-models` - List all available models
