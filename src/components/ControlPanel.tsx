"use client";

import { useState } from "react";
import { Loader2, Sparkles, Terminal as TerminalIcon, Download, FileJson, FileText } from "lucide-react";
import { STACK_PRESETS } from "@/lib/presets";
import { cn } from "@/lib/utils";
import type { AttackScenario } from "@/lib/types";
import { exportScenarioAsJson, exportScenarioAsMarkdown } from "@/lib/export";

interface ControlPanelProps {
  target: string;
  onTargetChange: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
  scenario: AttackScenario | null;
}

export default function ControlPanel({ target, onTargetChange, onGenerate, loading, scenario }: ControlPanelProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  return (
    <div className="glass-panel flex h-full flex-col gap-6 overflow-y-auto rounded-2xl border p-5">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TerminalIcon size={14} className="text-cyan-neon" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-300">Target Stack Input</h2>
        </div>
        <textarea
          value={target}
          onChange={(e) => {
            onTargetChange(e.target.value);
            setActivePreset(null);
          }}
          placeholder="Describe the target infrastructure, e.g. Node.js REST API + PostgreSQL + AWS S3 Bucket + Docker"
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-void-950/70 px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-neon/60 focus:shadow-neon-cyan"
        />
      </div>

      <div>
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onTargetChange(preset.value);
                setActivePreset(preset.label);
              }}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition",
                activePreset === preset.label
                  ? "border-violet-neon/60 bg-violet-neon/15 text-violet-glow shadow-neon-violet"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-neon/40 hover:text-cyan-neon"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || !target.trim()}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-[13px] font-semibold uppercase tracking-wider transition",
          loading || !target.trim()
            ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-600"
            : "border-cyan-neon/50 bg-cyan-neon/10 text-cyan-neon shadow-neon-cyan hover:bg-cyan-neon/20"
        )}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Emulating Attack Chain...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Attack Scenario
          </>
        )}
      </button>

      {scenario && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Scenario Summary</p>
          <p className="line-clamp-6 text-[12.5px] leading-relaxed text-slate-400">{scenario.summary}</p>

          <div className="mt-4 flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Export</p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => exportScenarioAsMarkdown(scenario)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-[11px] text-slate-300 transition hover:border-cyan-neon/40 hover:text-cyan-neon"
            >
              <FileText size={13} />
              Markdown
            </button>
            <button
              onClick={() => exportScenarioAsJson(scenario)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-[11px] text-slate-300 transition hover:border-violet-neon/40 hover:text-violet-glow"
            >
              <FileJson size={13} />
              JSON
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <Download size={13} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Scenarios are generated for authorized adversary emulation and blue-team training only. Always operate
          within a signed rules-of-engagement scope.
        </p>
      </div>
    </div>
  );
}
