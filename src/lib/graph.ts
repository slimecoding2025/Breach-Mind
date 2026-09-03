import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { AttackNodeData, AttackScenario } from "./types";
import { PHASE_ORDER } from "./types";

const COLUMN_WIDTH = 340;
const ROW_HEIGHT = 150;

const PHASE_EDGE_COLOR: Record<string, string> = {
  reconnaissance: "#22f5ff",
  initial_access: "#a855f7",
  privilege_escalation: "#ff9d3d",
  exfiltration_persistence: "#ff3366",
};

export function buildGraphElements(scenario: AttackScenario): {
  nodes: Node[];
  edges: Edge[];
} {
  const grouped: Record<string, AttackNodeData[]> = {};
  for (const phase of PHASE_ORDER) grouped[phase] = [];
  for (const node of scenario.nodes) {
    if (!grouped[node.phase]) grouped[node.phase] = [];
    grouped[node.phase].push(node);
  }

  const nodes: Node[] = [];
  const idToPhaseIndex = new Map<string, number>();

  PHASE_ORDER.forEach((phase, colIndex) => {
    const phaseNodes = grouped[phase] ?? [];
    const columnHeight = phaseNodes.length * ROW_HEIGHT;
    const startY = -columnHeight / 2;

    phaseNodes.forEach((attack, rowIndex) => {
      idToPhaseIndex.set(attack.id, colIndex);
      nodes.push({
        id: attack.id,
        type: "attackNode",
        position: {
          x: colIndex * COLUMN_WIDTH,
          y: startY + rowIndex * ROW_HEIGHT,
        },
        data: { attack } as unknown as Record<string, unknown>,
        draggable: true,
      });
    });
  });

  const edges: Edge[] = [];
  const edgeIds = new Set<string>();
  const nodeIndexById = new Map(scenario.nodes.map((n) => [n.id, n]));

  function addEdge(source: string, target: string, animated: boolean) {
    const id = `${source}->${target}`;
    if (edgeIds.has(id) || source === target) return;
    edgeIds.add(id);
    const targetNode = nodeIndexById.get(target);
    const color = targetNode ? PHASE_EDGE_COLOR[targetNode.phase] ?? "#22f5ff" : "#22f5ff";
    edges.push({
      id,
      source,
      target,
      animated,
      style: { stroke: color, strokeWidth: 1.6 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    });
  }

  for (const phase of PHASE_ORDER) {
    const phaseNodes = grouped[phase] ?? [];
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const prevPhase = PHASE_ORDER[phaseIndex - 1];
    const prevNodes = prevPhase ? grouped[prevPhase] ?? [] : [];

    phaseNodes.forEach((attack, rowIndex) => {
      const explicitDeps = (attack.dependsOn ?? []).filter((depId) => nodeIndexById.has(depId));

      if (explicitDeps.length > 0) {
        explicitDeps.forEach((depId) => addEdge(depId, attack.id, attack.severity === "Critical"));
      } else if (prevNodes.length > 0) {
        const fallbackSource = prevNodes[Math.min(rowIndex, prevNodes.length - 1)];
        addEdge(fallbackSource.id, attack.id, attack.severity === "Critical");
      }
    });
  }

  return { nodes, edges };
}
