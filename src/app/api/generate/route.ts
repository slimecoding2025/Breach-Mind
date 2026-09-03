import { NextRequest, NextResponse } from "next/server";
import { generateAttackScenario, OpenRouterError } from "@/lib/openrouter";
import { buildFallbackScenario } from "@/lib/sample-data";
import type { GenerateScenarioResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let target = "";
  try {
    const body = await request.json();
    target = typeof body?.target === "string" ? body.target.trim() : "";
  } catch {
    // ignore malformed body, handled below
  }

  if (!target) {
    return NextResponse.json<GenerateScenarioResponse>(
      { ok: false, error: "A target infrastructure description is required.", scenario: buildFallbackScenario("") },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    const scenario = buildFallbackScenario(target);
    scenario.errorNote = "OPENROUTER_API_KEY is not configured on the server — showing offline sample scenario.";
    return NextResponse.json<GenerateScenarioResponse>({
      ok: true,
      error: scenario.errorNote,
      scenario,
    });
  }

  try {
    const scenario = await generateAttackScenario(target, apiKey);
    return NextResponse.json<GenerateScenarioResponse>({ ok: true, scenario });
  } catch (err) {
    const message = err instanceof OpenRouterError ? err.message : "Unexpected error generating scenario.";
    const scenario = buildFallbackScenario(target);
    scenario.errorNote = `AI generation failed (${message}) — showing offline sample scenario.`;
    return NextResponse.json<GenerateScenarioResponse>({
      ok: true,
      error: scenario.errorNote,
      scenario,
    });
  }
}
