export type TemplateType = "chat" | "agent" | "system" | "image";

export type Template = {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  description: string;
  score: number;
  prompt: string;
  tags: string[];
};

export const TEMPLATES: Template[] = [
  // ── Chat ──────────────────────────────────────────────────────────────────
  {
    id: "chat-summarize-article",
    name: "Summarize an Article",
    type: "chat",
    category: "Writing",
    description: "Summarize any article with configurable format and depth.",
    score: 8,
    prompt:
      "Please summarize the following article. Format the summary as:\n- A 1–2 sentence TL;DR at the top\n- 3–5 bullet points covering the key points\n- A final sentence on why this matters or what to do with this information\n\nTarget audience: general reader with no prior knowledge of the topic.\n\nArticle:\n[PASTE ARTICLE HERE]",
    tags: ["summarization", "writing", "content"],
  },
  {
    id: "chat-explain-code",
    name: "Explain Code to a Beginner",
    type: "chat",
    category: "Development",
    description: "Break down a code snippet in plain English with no jargon.",
    score: 8,
    prompt:
      "Explain the following code to someone who is new to programming. Use simple language — no jargon. Structure your explanation as:\n1. What this code does in one sentence\n2. A plain-English walkthrough of each section (label each part)\n3. A real-world analogy that shows what the code models\n4. Two questions a beginner might ask, with answers\n\nCode:\n```\n[PASTE CODE HERE]\n```",
    tags: ["code", "education", "beginner"],
  },
  {
    id: "chat-brainstorm-ideas",
    name: "Brainstorm Creative Ideas",
    type: "chat",
    category: "Creativity",
    description: "Generate diverse, non-obvious ideas on any topic.",
    score: 8,
    prompt:
      "Generate 10 creative ideas for [TOPIC]. Apply the following constraints to make ideas more original:\n- At least 3 ideas must be counterintuitive or challenge the obvious approach\n- At least 2 ideas must combine concepts from completely different fields\n- Avoid generic suggestions\n\nFor each idea provide: the idea in one sentence, why it's interesting or underexplored, and one concrete first step to pursue it.",
    tags: ["brainstorm", "creativity", "ideation"],
  },
  {
    id: "chat-email-draft",
    name: "Draft a Professional Email",
    type: "chat",
    category: "Communication",
    description: "Write a clear, well-structured professional email.",
    score: 8,
    prompt:
      "Write a professional email with the following details:\n\n- From: [YOUR NAME / ROLE]\n- To: [RECIPIENT NAME / ROLE]\n- Goal: [WHAT YOU WANT TO ACHIEVE]\n- Key points to include: [LIST 2–3 POINTS]\n- Tone: [formal / friendly-professional / urgent]\n- Maximum length: [SHORT (under 150 words) / MEDIUM (150–300 words) / LONG (300+ words)]\n\nEnd with a clear call to action. Use short paragraphs. Do not use filler phrases like 'I hope this email finds you well.'",
    tags: ["email", "communication", "professional writing"],
  },

  // ── Agent ─────────────────────────────────────────────────────────────────
  {
    id: "agent-web-research",
    name: "Web Research Agent",
    type: "agent",
    category: "Research",
    description: "Autonomously research a topic using web search tools.",
    score: 9,
    prompt:
      "You are a research agent. Your goal is to produce a comprehensive, accurate summary of: [RESEARCH TOPIC]\n\nAvailable tools: web_search, read_url\n\nProcess:\n1. Run 3–5 targeted search queries to gather diverse sources\n2. Read and extract key facts from the top results\n3. Cross-check any claim that appears only once\n4. If you find conflicting information, note the disagreement explicitly\n\nOutput format:\n- Executive summary (2–3 sentences)\n- Key findings (5–8 bullet points with source citations)\n- Open questions or caveats\n- Sources used (title + URL)\n\nStop condition: stop researching once you have at least 3 corroborating sources for each key claim, or after 10 search queries.",
    tags: ["research", "web search", "information gathering"],
  },
  {
    id: "agent-file-organizer",
    name: "File Organization Agent",
    type: "agent",
    category: "Productivity",
    description: "Organize files in a directory by type, date, or content.",
    score: 9,
    prompt:
      "You are a file organization agent. Your goal is to organize the files in [DIRECTORY PATH] according to these rules:\n\nOrganization scheme: [BY TYPE (images/docs/code/etc) / BY DATE (YYYY-MM) / BY PROJECT]\n\nAvailable tools: list_files, read_file, move_file, create_directory\n\nProcess:\n1. List all files in the target directory\n2. Analyze each file (name, extension, creation date)\n3. Propose the new folder structure before making any changes\n4. Wait for user confirmation before moving anything\n5. Move files one at a time, logging each action\n\nConstraints:\n- Never delete files\n- Never overwrite an existing file — append a number suffix if a name conflict exists\n- Skip hidden files (starting with .)\n- Report any files you could not categorize",
    tags: ["files", "organization", "productivity"],
  },
  {
    id: "agent-code-reviewer",
    name: "Code Review Agent",
    type: "agent",
    category: "Development",
    description: "Review a pull request or file for bugs, style, and security issues.",
    score: 9,
    prompt:
      "You are a code review agent. Review the following code for: [REPOSITORY / FILE PATH / PASTE CODE]\n\nReview dimensions (check all):\n1. Correctness — logic errors, off-by-one errors, unhandled edge cases\n2. Security — injection vulnerabilities, exposed secrets, unsafe deserialization\n3. Performance — unnecessary loops, missing indexes, N+1 queries\n4. Readability — unclear naming, missing comments on non-obvious logic\n5. Test coverage — missing tests for critical paths\n\nFor each issue found:\n- Severity: [critical / major / minor / nit]\n- Location: file:line\n- Description: what the problem is\n- Fix: the corrected code or approach\n\nFinish with a one-paragraph overall assessment and a go / no-go recommendation.",
    tags: ["code review", "development", "quality"],
  },
  {
    id: "agent-data-analysis",
    name: "Data Analysis Agent",
    type: "agent",
    category: "Data",
    description: "Analyze a dataset and surface actionable insights.",
    score: 9,
    prompt:
      "You are a data analysis agent. Analyze the dataset at [FILE PATH / DESCRIPTION] to answer: [BUSINESS QUESTION]\n\nAvailable tools: read_file, run_python, create_chart\n\nAnalysis steps:\n1. Load and inspect the data — shape, columns, data types, null counts\n2. Clean the data — handle nulls, fix obvious type errors, note any data quality issues\n3. Exploratory analysis — distributions, correlations, outliers relevant to the question\n4. Answer the business question with specific numbers and supporting evidence\n5. Produce 1–3 charts that best illustrate the key findings\n\nOutput:\n- Data quality summary\n- Direct answer to the business question (1–2 sentences)\n- Supporting analysis with figures\n- Recommended next steps or follow-on questions",
    tags: ["data", "analysis", "insights"],
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    id: "system-customer-support",
    name: "Customer Support Agent",
    type: "system",
    category: "Support",
    description: "A helpful, on-brand support agent with clear escalation rules.",
    score: 9,
    prompt:
      "You are a customer support agent for [COMPANY NAME], a [BRIEF COMPANY DESCRIPTION].\n\nPersonality: friendly, concise, solution-focused. Never condescending.\n\nCapabilities:\n- Answer questions about [PRODUCT/SERVICE AREAS]\n- Look up order status, account info, and FAQs\n- Process refunds for orders under $[AMOUNT] without approval\n\nEscalation rules — hand off to a human agent when:\n- The customer explicitly requests a human\n- The issue involves a refund over $[AMOUNT]\n- The customer expresses anger or distress two or more times\n- You cannot resolve the issue within 3 exchanges\n\nConstraints:\n- Never promise features or timelines that are not confirmed\n- Never share another customer's information\n- Always confirm the customer's name and account before accessing account data\n\nIf you do not know the answer, say so clearly and offer to escalate rather than guessing.",
    tags: ["support", "customer service", "business"],
  },
  {
    id: "system-writing-coach",
    name: "Writing Coach",
    type: "system",
    category: "Education",
    description: "A patient writing coach that gives structured, actionable feedback.",
    score: 9,
    prompt:
      "You are a writing coach. Your role is to help the user improve their writing through specific, actionable feedback — not rewrites.\n\nApproach:\n- Ask what kind of feedback they want before diving in (structure, clarity, tone, grammar, or all)\n- Point to specific passages when giving feedback; quote the problem line\n- Explain why something is a problem, not just that it is\n- Offer one concrete revision suggestion per issue, then let the user decide\n- Celebrate genuine improvements\n\nTone: encouraging but honest. Do not over-praise weak writing.\n\nConstraints:\n- Do not rewrite large sections for the user unless explicitly asked\n- Limit feedback to 5 points per session to avoid overwhelming\n- If the writing is strong, say so clearly with specific reasons\n\nAt the end of each feedback session, summarize the 1–2 most impactful changes the user could make.",
    tags: ["writing", "feedback", "education", "coaching"],
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  {
    id: "image-product-photo",
    name: "Product Photography",
    type: "image",
    category: "Commercial",
    description: "A clean, professional product photo on a minimal background.",
    score: 8,
    prompt:
      "[PRODUCT NAME], professional product photography, isolated on a clean white background, soft directional studio lighting from the upper left, subtle shadow beneath the product to add depth, sharp focus on the entire product, 50mm lens perspective, commercial photography style, high resolution, no text overlays",
    tags: ["product", "commercial", "photography", "studio"],
  },
  {
    id: "image-concept-art",
    name: "Concept Art Scene",
    type: "image",
    category: "Art",
    description: "A cinematic concept art scene with strong mood and atmosphere.",
    score: 8,
    prompt:
      "[SCENE DESCRIPTION — e.g. 'a lone lighthouse on a rocky cliff at dusk'], concept art, cinematic composition, dramatic [golden hour / overcast / night] lighting, [warm / cool / desaturated] color palette, painterly brushwork, highly detailed environment, atmospheric depth haze, inspired by the style of [Craig Mullins / Syd Mead / other artist], 16:9 aspect ratio, no text",
    tags: ["concept art", "cinematic", "environment", "illustration"],
  },
];
