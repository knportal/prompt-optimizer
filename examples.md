# Prompt Optimizer — Working Examples

Three end-to-end examples a reviewer can run to verify the extension works.

---

## Example 1 — Chat prompt optimization

**Input to Claude Desktop or Claude Code:**
```
optimize this prompt: "summarize this article"
```

**What happens:** Claude calls `optimize_prompt` with `type: chat`.

**Expected output:**
- `original_score`: 2–3 ("Too vague" or similar verdict)
- `original_issues`: flags missing context such as no format, length, or audience specified
- `improved_prompt`: a rewritten version that asks for format preference (bullet points vs. paragraph), desired length, target audience (expert vs. general), and key focus areas
- `improved_score`: 7–9

---

## Example 2 — Agent prompt optimization

**Input:**
```
optimize this for an agent: "send a slack message"
```

**What happens:** Claude calls `optimize_prompt` with `type: agent`.

**Expected output:**
- `original_score`: 2 ("Barely a concept" or similar)
- `original_issues`: flags missing tool definition, no channel/recipient specified, no error handling, no success criteria
- `improved_prompt`: a rewritten version that defines the available Slack tool, specifies required parameters (channel, message text, sender context), defines success (message delivered confirmation), and includes fallback behavior if the send fails
- `improved_score`: 8–9

---

## Example 3 — History and reuse

**Step 1 — After running Examples 1 and 2, ask:**
```
what have I optimized recently?
```

**What happens:** Claude calls `get_history` (limit 10) and returns a readable summary of recent entries including the article summary and Slack agent prompts.

**Expected output:** A list of recent optimizations with original prompt text, scores, and timestamps.

---

**Step 2 — Then say:**
```
reuse the article summary one
```

**What happens:** Claude calls `get_history` with `search: "article"` to find the entry, then calls `reuse_prompt` with its ID.

**Expected output:** The full improved prompt for the article summary, ready to copy, plus a reminder of the original score and what was improved.
