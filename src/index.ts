import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";
import "dotenv/config";

// ── Constants ───────────────────────────────────────────────────────────────

const HISTORY_DIR = join(homedir(), ".prompt-optimizer");
const HISTORY_FILE = join(HISTORY_DIR, "history.json");
const HISTORY_MAX = 200;
const HISTORY_RESOURCE_URI = "prompts://history";

// ── Schemas ─────────────────────────────────────────────────────────────────

const PromptType = z.enum(["chat", "agent", "system", "image"]);

const OptimizePromptSchema = z.object({
  prompt: z.string().min(1),
  type: PromptType.default("chat"),
});

const OptimizeResultSchema = z.object({
  original_score: z.number().int().min(1).max(10),
  original_verdict: z.string(),
  original_issues: z.array(z.string()).min(2).max(4),
  improved_prompt: z.string(),
  improved_score: z.number().int().min(1).max(10),
  improvements: z.array(z.string()).min(2).max(4),
  context_tip: z.string(),
});

const GetHistorySchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  type: z.enum(["chat", "agent", "system", "image", "all"]).default("all"),
  search: z.string().optional(),
});

const ReusePromptSchema = z.object({
  id: z.string().min(1),
});

type HistoryEntry = {
  id: string;
  timestamp: string;
  type: "chat" | "agent" | "system" | "image";
  original_prompt: string;
  original_score: number;
  improved_prompt: string;
  improved_score: number;
  improvements: string[];
  context_tip: string;
};

// ── History helpers ──────────────────────────────────────────────────────────

async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await fs.readFile(HISTORY_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendHistory(entry: HistoryEntry): Promise<void> {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
  const existing = await readHistory();
  const updated = [entry, ...existing].slice(0, HISTORY_MAX);
  await fs.writeFile(HISTORY_FILE, JSON.stringify(updated, null, 2), "utf-8");
}

// Fire-and-forget — never awaited inside the optimize_prompt response path
function saveHistory(entry: HistoryEntry): void {
  appendHistory(entry).catch((err) =>
    process.stderr.write(`[prompt-optimizer] history write failed: ${err}\n`)
  );
}

// ── Prompt engineering ───────────────────────────────────────────────────────

const TYPE_GUIDANCE: Record<string, string> = {
  chat: "This is a CHAT prompt — intended for a conversational back-and-forth with an LLM. Optimize for clarity of goal, tone specification, and output format hints.",
  agent:
    "This is an AGENT prompt — it will drive an autonomous agent that may use tools. Optimize for clear objective, tool usage guidance, success criteria, and ambiguity handling.",
  system:
    "This is a SYSTEM prompt — it sets the persistent behavior of an LLM across a session. Optimize for persona clarity, strict output constraints, and edge-case handling.",
  image:
    "This is an IMAGE prompt — it will be sent to an image generation model. Optimize for subject description, artistic style, lighting, composition, and mood.",
};

const SYSTEM_PROMPT = `You are an expert AI prompt engineer. Your job is to analyze a user-submitted prompt, score it, and return an improved version.

You MUST respond with ONLY valid JSON — no markdown, no code fences, no backticks, no preamble, no explanation outside the JSON. The response must be parseable by JSON.parse() with zero preprocessing.

Return exactly this shape:
{
  "original_score": <integer 1-10, honest assessment of the original>,
  "original_verdict": <short phrase summarizing the core problem, e.g. "Too vague" or "Missing context">,
  "original_issues": [<2-4 short strings describing specific problems>],
  "improved_prompt": <the full rewritten prompt as a single string>,
  "improved_score": <integer 1-10, your assessment of the improved version>,
  "improvements": [<2-4 short strings naming what you changed and why>],
  "context_tip": <one actionable sentence specific to this prompt type>
}

Scoring rubric:
- 1-3: Barely usable. Extremely vague, no context, no goal.
- 4-5: Partial. Has a topic but missing critical structure, tone, or format guidance.
- 6-7: Decent. Clear goal but missing some best practices.
- 8-9: Strong. Clear role, goal, constraints, and format. Near production-ready.
- 10: Perfect. Nothing to improve.

Be honest — a bad prompt should score 3-5. Your improved version should score 7-9.`;

// ── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── MCP server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "prompt-optimizer", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// ── Tools: list ──────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "optimize_prompt",
      description:
        "Analyzes and improves an AI prompt. Use this when the user shares a prompt, asks for help writing one, wants to know if their prompt is good, or wants better results from an AI model. Scores the original 1–10, identifies issues, and returns a rated improved version.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The rough prompt to analyze and improve" },
          type: {
            type: "string",
            enum: ["chat", "agent", "system", "image"],
            default: "chat",
            description: "The intended use-case type for this prompt",
          },
        },
        required: ["prompt"],
      },
    },
    {
      name: "get_history",
      description:
        "Returns previously optimized prompts from local history. Use when the user asks what prompts they've optimized before, wants to browse past results, or wants to find a prompt by topic.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", default: 10, description: "How many entries to return (max 50)" },
          type: {
            type: "string",
            enum: ["chat", "agent", "system", "image", "all"],
            default: "all",
            description: "Filter by prompt type",
          },
          search: { type: "string", description: "Filter entries containing this string (case-insensitive)" },
        },
      },
    },
    {
      name: "reuse_prompt",
      description:
        "Retrieves a specific improved prompt from history by ID. Use when the user wants to reuse or copy a previously optimized prompt.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The UUID of the history entry to retrieve" },
        },
        required: ["id"],
      },
    },
  ],
}));

// ── Tools: call ──────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  // ── optimize_prompt ────────────────────────────────────────────────────────
  if (name === "optimize_prompt") {
    const parsed = OptimizePromptSchema.safeParse(request.params.arguments);
    if (!parsed.success) throw new Error(`Invalid arguments: ${parsed.error.message}`);
    const { prompt, type } = parsed.data;

    process.stderr.write(
      `[prompt-optimizer] optimize_prompt called — type=${type}, prompt_length=${prompt.length}\n`
    );

    const userMessage = `${TYPE_GUIDANCE[type]}\n\nPrompt to analyze:\n"""\n${prompt}\n"""`;

    let rawText: string;
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected response type from Claude API");
      rawText = block.text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[prompt-optimizer] Claude API error: ${msg}\n`);
      throw new Error(`Claude API call failed: ${msg}`);
    }

    let result: z.infer<typeof OptimizeResultSchema>;
    try {
      const json = JSON.parse(rawText);
      const validation = OptimizeResultSchema.safeParse(json);
      if (!validation.success) throw new Error(`Schema mismatch: ${validation.error.message}`);
      result = validation.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[prompt-optimizer] JSON parse error: ${msg}\nRaw: ${rawText}\n`);
      throw new Error(`Failed to parse Claude response as valid JSON: ${msg}`);
    }

    process.stderr.write(
      `[prompt-optimizer] success — original_score=${result.original_score}, improved_score=${result.improved_score}\n`
    );

    // Fire-and-forget history save
    saveHistory({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      original_prompt: prompt,
      original_score: result.original_score,
      improved_prompt: result.improved_prompt,
      improved_score: result.improved_score,
      improvements: result.improvements,
      context_tip: result.context_tip,
    });

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  // ── get_history ────────────────────────────────────────────────────────────
  if (name === "get_history") {
    const parsed = GetHistorySchema.safeParse(request.params.arguments);
    if (!parsed.success) throw new Error(`Invalid arguments: ${parsed.error.message}`);
    const { limit, type, search } = parsed.data;

    const all = await readHistory();
    let filtered = type === "all" ? all : all.filter((e) => e.type === type);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.original_prompt.toLowerCase().includes(q) ||
          e.improved_prompt.toLowerCase().includes(q)
      );
    }

    const entries = filtered.slice(0, limit);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { total_saved: all.length, returned: entries.length, entries },
            null,
            2
          ),
        },
      ],
    };
  }

  // ── reuse_prompt ───────────────────────────────────────────────────────────
  if (name === "reuse_prompt") {
    const parsed = ReusePromptSchema.safeParse(request.params.arguments);
    if (!parsed.success) throw new Error(`Invalid arguments: ${parsed.error.message}`);
    const { id } = parsed.data;

    const all = await readHistory();
    const entry = all.find((e) => e.id === id);
    if (!entry) {
      return {
        content: [
          { type: "text", text: `No history entry found with id: ${id}` },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              improved_prompt: entry.improved_prompt,
              context: {
                type: entry.type,
                original_score: entry.original_score,
                improved_score: entry.improved_score,
                improvements: entry.improvements,
                context_tip: entry.context_tip,
                optimized_at: entry.timestamp,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ── Resources ────────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: HISTORY_RESOURCE_URI,
      name: "Recent Prompt History",
      description: "The 10 most recently optimized prompts. Read this to answer questions about what the user has optimized before.",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri !== HISTORY_RESOURCE_URI) {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  }
  const all = await readHistory();
  const recent = all.slice(0, 10);
  return {
    contents: [
      {
        uri: HISTORY_RESOURCE_URI,
        mimeType: "application/json",
        text: JSON.stringify({ total_saved: all.length, recent }, null, 2),
      },
    ],
  };
});

// ── Startup ──────────────────────────────────────────────────────────────────

async function main() {
  if (
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY === "your_key_here"
  ) {
    process.stderr.write(
      "[prompt-optimizer] ERROR: ANTHROPIC_API_KEY is not set. Add it to .env\n"
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[prompt-optimizer] MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`[prompt-optimizer] Fatal error: ${err}\n`);
  process.exit(1);
});
