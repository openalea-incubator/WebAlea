import React, { useMemo } from "react";
import { Modal, Button } from "react-bootstrap";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const PADDING = 20;

function buildPreviewLayout(graph) {
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph?.edges) ? graph.edges : [];

    const preparedNodes = nodes.map((node, index) => {
        const label = node?.data?.label || node?.data?.nodeName || node?.id || `node_${index}`;
        const position = node?.position || { x: (index % 4) * 200, y: Math.floor(index / 4) * 120 };
        return {
            id: node.id || `node_${index}`,
            label,
            x: position.x,
            y: position.y
        };
    });

    const minX = Math.min(0, ...preparedNodes.map(n => n.x));
    const minY = Math.min(0, ...preparedNodes.map(n => n.y));

    const normalizedNodes = preparedNodes.map(n => ({
        ...n,
        x: n.x - minX + PADDING,
        y: n.y - minY + PADDING
    }));

    const maxX = Math.max(0, ...normalizedNodes.map(n => n.x + NODE_WIDTH));
    const maxY = Math.max(0, ...normalizedNodes.map(n => n.y + NODE_HEIGHT));

    return {
        nodes: normalizedNodes,
        edges,
        width: maxX + PADDING,
        height: maxY + PADDING
    };
}

export default function CompositeInspectModal({ show, onClose, compositeNode }) {
    const graph = compositeNode?.data?.graph;
    const hasGraph = Array.isArray(graph?.nodes) && graph.nodes.length > 0;

    const layout = useMemo(() => {
        if (!hasGraph) return { nodes: [], edges: [], width: 400, height: 240 };
        return buildPreviewLayout(graph);
    }, [graph, hasGraph]);

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Inspect Composite</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!hasGraph ? (
                    <div className="p-3 bg-white rounded shadow-sm">
                        This composite has no graph to preview.
                    </div>
                ) : (
                    <div style={{ position: "relative", overflow: "auto", border: "1px solid #eee" }}>
                        <svg width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0 }}>
                            {layout.edges.map((edge, index) => {
                                const source = layout.nodes.find(n => n.id === edge.source);
                                const target = layout.nodes.find(n => n.id === edge.target);
                                if (!source || !target) return null;
                                const x1 = source.x + NODE_WIDTH;
                                const y1 = source.y + NODE_HEIGHT / 2;
                                const x2 = target.x;
                                const y2 = target.y + NODE_HEIGHT / 2;
                                return (
                                    <path
                                        key={edge.id || `edge_${index}`}
                                        d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`}
                                        stroke="#9aa0a6"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                );
                            })}
                        </svg>
                        <div style={{ position: "relative", width: layout.width, height: layout.height }}>
                            {layout.nodes.map(node => (
                                <div
                                    key={node.id}
                                    style={{
                                        position: "absolute",
                                        left: node.x,
                                        top: node.y,
                                        width: NODE_WIDTH,
                                        height: NODE_HEIGHT,
                                        border: "1px solid #cfd8dc",
                                        borderRadius: "6px",
                                        background: "#f8f9fa",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        color: "#37474f"
                                    }}
                                >
                                    {node.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
