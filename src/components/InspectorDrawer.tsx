"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Crosshair,
  DoorOpen,
  ChevronsUp,
  UploadCloud,
  Wrench,
  GitBranch,
} from "lucide-react";
import type { AttackNodeData, AttackPhase } from "@/lib/types";
import { PHASE_LABELS } from "@/lib/types";
import { cn, copyToClipboard, severityColor } from "@/lib/utils";

const PHASE_ICON: Record<AttackPhase, typeof Crosshair> = {
  reconnaissance: Crosshair,
  initial_access: DoorOpen,
  privilege_escalation: ChevronsUp,
  exfiltration_persistence: UploadCloud,
};

interface InspectorDrawerProps {
  node: AttackNodeData | null;
  onClose: () => void;
}

export default function InspectorDrawer({ node, onClose }: InspectorDrawerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!node) return;
    const success = await copyToClipboard(node.command);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto glass-panel border-l shadow-panel lg:sticky lg:top-0 lg:h-screen lg:max-w-full"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-void-900/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-neon" />
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-neon">
                  Threat Inspector
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close inspector"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 px-5 py-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    {(() => {
                      const Icon = PHASE_ICON[node.phase];
                      return <Icon size={11} className="text-cyan-neon" />;
                    })()}
                    {PHASE_LABELS[node.phase]}
                  </span>
                  <SeverityBadge severity={node.severity} />
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-50">{node.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-cyan-neon/90">
                  <span className="rounded bg-cyan-neon/10 px-2 py-0.5">{node.mitreId}</span>
                  <span className="text-slate-500">{node.mitreTactic}</span>
                </div>
              </div>

              <Section title="Attack Vector Description" icon={<Crosshair size={13} className="text-cyan-neon" />}>
                <p className="text-[13px] leading-relaxed text-slate-300">{node.description}</p>
              </Section>

              <Section title="Executable Command / Payload" icon={<Terminal size={13} className="text-cyan-neon" />}>
                <div className="relative overflow-hidden rounded-lg border border-cyan-neon/20 bg-[#020617]">
                  <div className="flex items-center justify-between border-b border-cyan-neon/10 bg-white/[0.02] px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition",
                        copied
                          ? "border-[#4ade80]/50 bg-[#4ade80]/10 text-[#4ade80]"
                          : "border-cyan-neon/30 bg-cyan-neon/5 text-cyan-neon hover:bg-cyan-neon/15"
                      )}
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#7ef9c1]">
{node.command}
                  </pre>
                </div>
              </Section>

              <Section title="Blue Team Remediation" icon={<ShieldCheck size={13} className="text-[#4ade80]" />}>
                <div className="rounded-lg border border-[#4ade80]/25 bg-[#4ade80]/[0.06] px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-slate-200">{node.remediation}</p>
                </div>
              </Section>

              {node.tools.length > 0 && (
                <Section title="Tools Observed" icon={<Wrench size={13} className="text-violet-neon" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {node.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-md border border-violet-neon/30 bg-violet-neon/10 px-2 py-1 font-mono text-[11px] text-violet-glow"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {node.dependsOn && node.dependsOn.length > 0 && (
                <Section title="Prerequisite Steps" icon={<GitBranch size={13} className="text-slate-400" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {node.dependsOn.map((dep) => (
                      <span
                        key={dep}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-400"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AttackNodeData["severity"] }) {
  const sev = severityColor(severity);
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider",
        sev.text,
        sev.bg,
        sev.border
      )}
    >
      {severity}
    </span>
  );
}
