"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Crosshair, DoorOpen, ChevronsUp, UploadCloud, ShieldAlert } from "lucide-react";
import { cn, severityColor } from "@/lib/utils";
import type { AttackNodeData, AttackPhase } from "@/lib/types";
import { PHASE_SHORT_LABELS } from "@/lib/types";

const PHASE_ICON: Record<AttackPhase, typeof Crosshair> = {
  reconnaissance: Crosshair,
  initial_access: DoorOpen,
  privilege_escalation: ChevronsUp,
  exfiltration_persistence: UploadCloud,
};

const PHASE_ACCENT: Record<AttackPhase, string> = {
  reconnaissance: "border-cyan-neon/40 hover:border-cyan-neon/80",
  initial_access: "border-violet-neon/40 hover:border-violet-neon/80",
  privilege_escalation: "border-[#ff9d3d]/40 hover:border-[#ff9d3d]/80",
  exfiltration_persistence: "border-[#ff3366]/40 hover:border-[#ff3366]/80",
};

export interface AttackFlowNodeType {
  attack: AttackNodeData;
  selected?: boolean;
}

function AttackNodeComponent({ data, selected }: NodeProps) {
  const attack = (data as unknown as AttackFlowNodeType).attack;
  const Icon = PHASE_ICON[attack.phase];
  const sev = severityColor(attack.severity);

  return (
    <div
      className={cn(
        "group relative w-[260px] rounded-xl border bg-void-900/95 px-4 py-3.5 shadow-panel backdrop-blur-md transition-all duration-200",
        PHASE_ACCENT[attack.phase],
        selected && "ring-2 ring-cyan-neon/70 shadow-neon-cyan scale-[1.02]"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-cyan-neon !bg-void-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-cyan-neon !bg-void-900"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-widest text-slate-400">
          <Icon size={10} className="text-cyan-neon" />
          {PHASE_SHORT_LABELS[attack.phase]}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            sev.text,
            sev.bg,
            sev.border
          )}
        >
          <ShieldAlert size={10} />
          {attack.severity}
        </span>
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-100">
        {attack.title}
      </h3>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-cyan-neon/80">
        <span className="rounded bg-cyan-neon/10 px-1.5 py-0.5">{attack.mitreId}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
        {attack.mitreTactic}
      </p>

      <div className="pointer-events-none absolute inset-0 rounded-xl bg-radial-fade opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </div>
  );
}

export default memo(AttackNodeComponent);
