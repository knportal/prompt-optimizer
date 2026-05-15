# Prompt Optimizer

Prompt Optimizer is a Claude Desktop Extension that instantly improves your AI prompts. Paste any rough idea — a few words or a half-formed sentence — and get back a scored, rewritten version with a clear explanation of what changed and why. Works for chat prompts, agent instructions, system prompts, and image generation prompts.

## Install

1. Download `prompt-optimizer.mcpb` from the [Releases](https://github.com/knportal/prompt-optimizer/releases) page
2. Double-click the file — Claude Desktop opens an install dialog
3. Enter your [Anthropic API key](https://console.anthropic.com) when prompted
4. Click **Install**

The `optimize_prompt` tool is now available in every Claude Desktop conversation.

## Usage

Just describe what you want or paste a prompt directly:

```
optimize this prompt: "summarize this article"
```

```
optimize this for an agent: "send a slack message"
```

```
what have I optimized recently?
```

```
reuse the article summary one
```

```
show me starter templates
```

```
show me agent templates
```

```
use the code review one
```

See [examples.md](examples.md) for full end-to-end examples with expected outputs.

## Tools

| Tool | What it does |
|---|---|
| `optimize_prompt` | Scores your prompt 1–10 and returns an improved version with explanations |
| `get_history` | Browse and search previously optimized prompts |
| `reuse_prompt` | Retrieve a specific improved prompt from history by ID |
| `get_templates` | List built-in starter templates, filterable by type (chat, agent, system, image) |
| `use_template` | Retrieve a full starter template by ID and save it to history |

## How it works

When you submit a prompt, the extension sends it to Claude (via your API key) with expert prompt engineering instructions. The result — score, issues, improved version, and a pro tip — is returned immediately and saved locally to `~/.prompt-optimizer/history.json`.

No data is stored on any external server. See the [Privacy Policy](privacy-policy.md) for details.

## Development

```bash
git clone https://github.com/knportal/prompt-optimizer.git
cd prompt-optimizer
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

To repack after changes:
```bash
npm run build
cp dist/index.js server/index.js
mcpb pack . prompt-optimizer.mcpb
```

## Privacy

Prompt text is sent to Anthropic's API for optimization. History is stored locally only. See [privacy-policy.md](privacy-policy.md).

## Submitting to the Anthropic Directory

[Local MCP Server Submission Guide](https://support.claude.com/en/articles/12922832-local-mcp-server-submission-guide)
