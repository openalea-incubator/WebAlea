import React, { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { useFlow } from "../../../workspace/providers/FlowContextDefinition.jsx";

/**
 * CompositeInspector
 * Visual read-only preview of a composite node's internal graph.
 */
export default function CompositeInspector() {
    const { currentNode, nodes } = useFlow();
    const node = nodes.find(n => n.id === currentNode);

    if (!node) {
        return <div className="p-3 bg-white rounded shadow-sm">No node selected.</div>;
    }

    const isComposite = node?.data?.nodekind === "composite";
    const graph = node?.data?.graph;

    if (!isComposite || !graph || !Array.isArray(graph.nodes)) {
        return (
            <div className="p-3 bg-white rounded shadow-sm">
                This node has no composite graph to preview.
            </div>
        );
    }

    const previewNodes = useMemo(() => {
        return graph.nodes.map((n, index) => {
            const label = n?.data?.label || n?.data?.nodeName || n?.id || `node_${index}`;
            return {
                id: n.id || `node_${index}`,
                type: "default",
                position: n.position || { x: 0, y: index * 80 },
                data: { label }
            };
        });
    }, [graph.nodes]);

    const previewEdges = useMemo(() => {
        if (!Array.isArray(graph.edges)) return [];
        return graph.edges.map((e, index) => ({
            id: e.id || `edge_${index}`,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: e.type || "smoothstep"
        }));
    }, [graph.edges]);

    return (
        <div style={{ width: "100%", height: "100%", background: "#fafafa" }}>
            <ReactFlow
                nodes={previewNodes}
                edges={previewEdges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={false}
                panOnScroll
                panOnDrag
            >
                <Background />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
