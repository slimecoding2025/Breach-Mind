"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldHalf,
  Radar,
  AlertTriangle,
  Crosshair,
  DoorOpen,
  ChevronsUp,
  UploadCloud,
  WifiOff,
  BookOpen,
} from "lucide-react";
import ControlPanel from "@/components/ControlPanel";
import AttackGraph from "@/components/AttackGraph";
import InspectorDrawer from "@/components/InspectorDrawer";
import type { AttackScenario, GenerateScenarioResponse } from "@/lib/types";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASE_ICONS = {
  reconnaissance: Crosshair,
  initial_access: DoorOpen,
  privilege_escalation: ChevronsUp,
  exfiltration_persistence: UploadCloud,
};

export default function HomePage() {
  const [target, setTarget] = useState(
    "Node.js REST API + PostgreSQL + AWS S3 Bucket + Docker containers"
  );
  const [scenario, setScenario] = useState<AttackScenario | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => scenario?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [scenario, selectedNodeId]
  );

  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const phase of PHASE_ORDER) counts[phase] = 0;
    scenario?.nodes.forEach((n) => {
      counts[n.phase] = (counts[n.phase] ?? 0) + 1;
    });
    return counts;
  }, [scenario]);

  const handleGenerate = useCallback(async () => {
    if (!target.trim() || loading) return;
    setLoading(true);
    setNotice(null);
    setSelectedNodeId(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data: GenerateScenarioResponse = await res.json();
      setScenario(data.scenario);
      if (data.error) setNotice(data.error);
    } catch {
      setNotice("Network error while contacting BreachMind engine. Try again.");
    } finally {
      setLoading(false);
    }
  }, [target, loading]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-radial-fade" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-void-900/70 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-neon/40 bg-cyan-neon/10 shadow-neon-cyan">
            <ShieldHalf size={18} className="text-cyan-neon" />
          </div>
          <div>
            <h1 className="font-mono text-base font-bold leading-none tracking-wide text-slate-50">
              Breach<span className="text-glow-cyan text-cyan-neon">Mind</span>
            </h1>
            <p className="mt-1 text-[11px] leading-none text-slate-500">
              AI Threat Emulation &amp; Attack Flow Generator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:flex">
            <Radar size={12} className="animate-pulse-glow text-cyan-neon" />
            MITRE ATT&amp;CK Aligned
          </span>
          <a
            href="https://attack.mitre.org/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-neon/40 hover:text-cyan-neon"
            title="MITRE ATT&CK Framework"
          >
            <BookOpen size={15} />
          </a>
        </div>
      </header>

      {notice && (
        <div className="relative z-10 mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-[#ffd23f]/40 bg-[#ffd23f]/10 px-4 py-2.5 font-mono text-[12px] text-[#ffe27a]">
          <WifiOff size={14} />
          {notice}
        </div>
      )}

      <main className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-5 px-6 py-5 lg:h-[calc(100vh-73px)] lg:flex-row">
        <section className="w-full shrink-0 lg:h-full lg:w-[340px]">
          <ControlPanel
            target={target}
            onTargetChange={setTarget}
            onGenerate={handleGenerate}
            loading={loading}
            scenario={scenario}
          />
        </section>

        <section className="flex min-h-[560px] flex-1 flex-col gap-3 lg:h-full">
          {scenario && (
            <div className="glass-panel flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5">
              {PHASE_ORDER.map((phase) => {
                const Icon = PHASE_ICONS[phase];
                return (
                  <div
                    key={phase}
                    className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-400"
                  >
                    <Icon size={12} className="text-cyan-neon" />
                    <span>{PHASE_LABELS[phase]}</span>
                    <span className="ml-1 rounded-full bg-cyan-neon/10 px-1.5 py-0.5 text-cyan-neon">
                      {phaseCounts[phase] ?? 0}
                    </span>
                  </div>
                );
              })}
              {scenario.isFallback && (
                <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-[#ff9d3d]/30 bg-[#ff9d3d]/10 px-2.5 py-1.5 font-mono text-[11px] text-[#ffab5e]">
                  <AlertTriangle size={12} />
                  Offline Fallback Mode
                </div>
              )}
            </div>
          )}

          <div className="glass-panel relative flex-1 overflow-hidden rounded-2xl border">
            {scenario ? (
              <AttackGraph scenario={scenario} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
            ) : (
              <EmptyState loading={loading} />
            )}
          </div>
        </section>

        <InspectorDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} />
      </main>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px rgba(34,245,255,0.15)",
            "0 0 45px rgba(34,245,255,0.35)",
            "0 0 20px rgba(34,245,255,0.15)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-neon/40 bg-cyan-neon/5",
          loading && "animate-pulse-glow"
        )}
      >
        <ShieldHalf size={28} className="text-cyan-neon" />
      </motion.div>
      <div>
        <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-slate-300">
          {loading ? "Compiling Attack Flow..." : "Awaiting Target Definition"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
          {loading
            ? "BreachMind is emulating adversary tradecraft across the MITRE ATT&CK kill chain for your stack."
            : "Describe your infrastructure or pick a preset, then generate an interactive attack emulation graph."}
        </p>
      </div>
    </div>
  );
}
