import type { AttackNodeData, AttackPhase, AttackScenario, OpenRouterResponse, Severity } from "./types";
import { PHASE_ORDER } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = "inclusionai/ling-3.0-flash-fin:free";

const VALID_PHASES = new Set<AttackPhase>(PHASE_ORDER);
const VALID_SEVERITIES = new Set<Severity>(["Critical", "High", "Medium", "Low"]);

export class OpenRouterError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
  }
}

function buildSystemPrompt(): string {
  return `You are BreachMind, an AI red-team assistant for authorized adversary emulation. Generate realistic attack emulation plans strictly aligned to MITRE ATT&CK.

You MUST respond with ONLY valid raw JSON — no markdown code blocks (\`\`\`json), no text before or after.

JSON Schema:
{
  "target": "string",
  "summary": "1-2 short sentences summary",
  "nodes": [
    {
      "id": "recon-1",
      "phase": "reconnaissance",
      "title": "Short title",
      "mitreId": "T1190",
      "mitreTactic": "Initial Access",
      "description": "Short explanation (1 sentence).",
      "command": "Short command",
      "remediation": "Short mitigation tip.",
      "severity": "High",
      "tools": ["nmap"],
      "dependsOn": []
    }
  ]
}

Strict Rules:
- Generate EXACTLY 1 node per phase (4 nodes total in this order: reconnaissance, initial_access, privilege_escalation, exfiltration_persistence).
- Keep descriptions, commands, and remediations short to prevent JSON truncation.
- "phase" must be one of: "reconnaissance", "initial_access", "privilege_escalation", "exfiltration_persistence".
- "severity" must be one of: "Critical", "High", "Medium", "Low".
- Ensure valid double-quoted JSON output.`;
}

function buildUserPrompt(target: string): string {
  return `Target stack: "${target}". Output pure valid JSON now.`;
}

/** Robust JSON cleaner and auto-repairer for cut-off LLM responses. */
function repairAndParseJson(raw: string): unknown {
  let text = raw.trim();

  // 1. Remove markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // 2. Isolate JSON starting from first '{'
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    text = text.slice(firstBrace);
  }

  // 3. Sanitize common syntax issues
  text = text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([\]}])/g, "$1") // remove trailing commas
    .replace(/\u0000/g, "");

  // First parsing attempt
  try {
    return JSON.parse(text);
  } catch {
    // If simple parse fails, try auto-repairing truncated structure
  }

  // 4. Try trimming to last valid object closing bracket '}'
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(0, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue to bracket completion strategy
    }
  }

  // 5. If JSON was cut off inside nodes array, attempt auto-closing
  let fixed = text;
  const lastNodeStart = fixed.lastIndexOf("{");
  if (lastNodeStart > 0 && fixed.lastIndexOf("}") < lastNodeStart) {
    fixed = fixed.substring(0, lastNodeStart).replace(/,\s*$/, "");
  }

  const openBrackets = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length;
  const openBraces = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length;

  for (let i = 0; i < openBrackets; i++) fixed += "]";
  for (let i = 0; i < openBraces; i++) fixed += "}";

  return JSON.parse(fixed);
}

function coercePhase(value: unknown): AttackPhase {
  if (typeof value === "string" && VALID_PHASES.has(value as AttackPhase)) {
    return value as AttackPhase;
  }
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[\s-]/g, "_");
  if (VALID_PHASES.has(normalized as AttackPhase)) return normalized as AttackPhase;
  return "reconnaissance";
}

function coerceSeverity(value: unknown): Severity {
  const str = String(value ?? "").trim();
  const capitalized = (str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()) as Severity;
  return VALID_SEVERITIES.has(capitalized) ? capitalized : "Medium";
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/** Validate and normalize raw parsed object into AttackScenario. */
function normalizeScenario(parsed: unknown, target: string): AttackScenario {
  if (!parsed || typeof parsed !== "object") {
    throw new OpenRouterError("AI response was not a JSON object.", "INVALID_SHAPE");
  }

  const obj = parsed as Record<string, unknown>;
  const rawNodes = Array.isArray(obj.nodes) ? obj.nodes : [];

  if (rawNodes.length === 0) {
    throw new OpenRouterError("AI response contained no attack nodes.", "EMPTY_NODES");
  }

  const seenIds = new Set<string>();
  const nodes: AttackNodeData[] = rawNodes.map((raw, index) => {
    const n = (raw ?? {}) as Record<string, unknown>;
    let id = typeof n.id === "string" && n.id.trim() ? n.id.trim() : `node-${index + 1}`;
    while (seenIds.has(id)) id = `${id}-${index + 1}`;
    seenIds.add(id);

    return {
      id,
      phase: coercePhase(n.phase),
      title: typeof n.title === "string" && n.title.trim() ? n.title.trim() : `Attack Step ${index + 1}`,
      mitreId: typeof n.mitreId === "string" && n.mitreId.trim() ? n.mitreId.trim() : "T1000",
      mitreTactic:
        typeof n.mitreTactic === "string" && n.mitreTactic.trim() ? n.mitreTactic.trim() : "Unclassified Tactic",
      description:
        typeof n.description === "string" && n.description.trim()
          ? n.description.trim()
          : "No description provided.",
      command: typeof n.command === "string" && n.command.trim() ? n.command.trim() : "# no command provided",
      remediation:
        typeof n.remediation === "string" && n.remediation.trim()
          ? n.remediation.trim()
          : "No remediation provided.",
      severity: coerceSeverity(n.severity),
      tools: coerceStringArray(n.tools),
      dependsOn: coerceStringArray(n.dependsOn),
    };
  });

  nodes.sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase));

  return {
    target: typeof obj.target === "string" && obj.target.trim() ? obj.target.trim() : target,
    summary:
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : `AI-generated adversary emulation plan for: ${target}`,
    generatedAt: new Date().toISOString(),
    nodes,
    sourceModel: OPENROUTER_MODEL,
  };
}

export interface GenerateOptions {
  timeoutMs?: number;
}

export async function generateAttackScenario(
  target: string,
  apiKey: string,
  options: GenerateOptions = {}
): Promise<AttackScenario> {
  const timeoutMs = options.timeoutMs ?? 120000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://breachmind.app",
        "X-Title": "BreachMind - AI Threat Emulation",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.1,
        max_tokens: 1500,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(target) },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        throw new OpenRouterError("OpenRouter API key is invalid or unauthorized.", "AUTH_ERROR");
      }
      if (response.status === 429) {
        throw new OpenRouterError("OpenRouter rate limit or quota exceeded.", "RATE_LIMIT");
      }
      throw new OpenRouterError(`OpenRouter request failed (${response.status}): ${errBody.slice(0, 300)}`, "HTTP_ERROR");
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new OpenRouterError(data.error.message || "Unknown OpenRouter error.", "API_ERROR");
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new OpenRouterError("OpenRouter response contained no content.", "EMPTY_RESPONSE");
    }

    let parsed: unknown;
    try {
      parsed = repairAndParseJson(content);
    } catch (parseErr) {
      throw new OpenRouterError(
        `Failed to parse AI JSON output: ${(parseErr as Error).message}`,
        "PARSE_ERROR"
      );
    }

    return normalizeScenario(parsed, target);
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new OpenRouterError("OpenRouter request timed out.", "TIMEOUT");
    }
    throw new OpenRouterError(
      `Unexpected error contacting OpenRouter: ${(err as Error).message}`,
      "UNKNOWN"
    );
  } finally {
    clearTimeout(timeout);
  }
}