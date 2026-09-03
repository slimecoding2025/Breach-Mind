"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AttackNode from "./nodes/AttackNode";
import { buildGraphElements } from "@/lib/graph";
import type { AttackScenario, Severity } from "@/lib/types";
import { severityColor } from "@/lib/utils";

const nodeTypes = { attackNode: AttackNode };

interface AttackGraphProps {
  scenario: AttackScenario;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

function GraphInner({ scenario, selectedNodeId, onSelectNode }: AttackGraphProps) {
  const { nodes: baseNodes, edges } = useMemo(() => buildGraphElements(scenario), [scenario]);

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edgeState, , onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setNodes(baseNodes);
  }, [baseNodes, setNodes]);

  const decoratedNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  );

  return (
    <ReactFlow
      nodes={decoratedNodes}
      edges={edgeState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onSelectNode(node.id)}
      fitView
      fitViewOptions={{ padding: 0.35, maxZoom: 1.1 }}
      minZoom={0.25}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      className="bg-transparent"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(34,245,255,0.15)" />
      <Controls showInteractive={false} position="bottom-right" />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(2,6,23,0.75)"
        nodeColor={(n) => {
          const attack = (n.data as unknown as { attack?: { severity?: Severity } })?.attack;
          if (!attack?.severity) return "#22f5ff";
          return severityColor(attack.severity).dot.replace("bg-[", "").replace("]", "");
        }}
        style={{ width: 160, height: 110 }}
      />
    </ReactFlow>
  );
}

export default function AttackGraph(props: AttackGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
