export type AttackPhase =
  | "reconnaissance"
  | "initial_access"
  | "privilege_escalation"
  | "exfiltration_persistence";

export const PHASE_ORDER: AttackPhase[] = [
  "reconnaissance",
  "initial_access",
  "privilege_escalation",
  "exfiltration_persistence",
];

export const PHASE_LABELS: Record<AttackPhase, string> = {
  reconnaissance: "Reconnaissance",
  initial_access: "Initial Access",
  privilege_escalation: "Privilege Escalation",
  exfiltration_persistence: "Data Exfiltration / Persistence",
};

export const PHASE_SHORT_LABELS: Record<AttackPhase, string> = {
  reconnaissance: "PHASE 1",
  initial_access: "PHASE 2",
  privilege_escalation: "PHASE 3",
  exfiltration_persistence: "PHASE 4",
};

export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface AttackNodeData {
  id: string;
  phase: AttackPhase;
  title: string;
  mitreId: string;
  mitreTactic: string;
  description: string;
  command: string;
  remediation: string;
  severity: Severity;
  tools: string[];
  dependsOn?: string[];
}

export interface AttackScenario {
  target: string;
  summary: string;
  generatedAt: string;
  nodes: AttackNodeData[];
  isFallback?: boolean;
  sourceModel?: string;
  errorNote?: string;
}

export interface OpenRouterChoice {
  message?: {
    role: string;
    content: string;
  };
  finish_reason?: string;
}

export interface OpenRouterResponse {
  id?: string;
  model?: string;
  choices?: OpenRouterChoice[];
  error?: {
    message: string;
    code?: string | number;
  };
}

export interface GenerateScenarioRequest {
  target: string;
}

export interface GenerateScenarioResponse {
  scenario: AttackScenario;
  ok: boolean;
  error?: string;
}
