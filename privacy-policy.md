# Privacy Policy — Prompt Optimizer

_Last updated: May 2026_

## What this extension does

Prompt Optimizer is a local MCP server that analyzes and improves AI prompts. It runs entirely on your machine and is installed as a Claude Desktop Extension (.mcpb).

## Data collected

The extension processes the prompts you submit for optimization and the improved results returned by the API. No other data is collected.

## Where data is stored

Optimized prompt history is stored **locally on your machine only**, in a single JSON file at:

```
~/.prompt-optimizer/history.json
```

This file is never uploaded, synced, or transmitted anywhere. You can delete it at any time to remove all history.

## What leaves your machine

When you call the `optimize_prompt` tool, the text of your prompt is sent to **Anthropic's API** (api.anthropic.com) to generate the improved version. This transmission is subject to [Anthropic's Privacy Policy](https://www.anthropic.com/privacy).

No prompt data is sent to any other third party or stored on any external server operated by this extension's author.

## What is not collected

- No account information
- No usage analytics or telemetry
- No device identifiers
- No data beyond the prompt text submitted during a session

## How to delete your data

Delete the history file at any time:

```bash
rm ~/.prompt-optimizer/history.json
```

To remove the extension entirely, uninstall it from Claude Desktop Settings → Extensions.

## Contact

For privacy questions, contact: kenneth@plenitudo.ai
