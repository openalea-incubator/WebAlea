import {
  ReactFlow,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../assets/css/workspace.css'; // Css perso
import { useFlow } from './providers/FlowContextDefinition.jsx';
import { useState, useRef } from 'react';
import CompositeInspectModal from './ui/CompositeInspectModal.jsx';

/**
 * WorkSpace - The main workspace component that renders the flow editor.
 * It utilizes ReactFlow to display nodes and edges, and provides controls for interaction.
 * The component retrieves nodes, edges, and related handlers from the Flow context.
 */
export default function WorkSpace() {

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, nodesTypes, onNodeClick } = useFlow();
  const [contextMenu, setContextMenu] = useState(null);
  const [inspectNode, setInspectNode] = useState(null);
  const containerRef = useRef(null);

  const handleNodeContextMenu = (event, node) => {
    event.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    const position = {
      x: rect ? event.clientX - rect.left : event.clientX,
      y: rect ? event.clientY - rect.top : event.clientY
    };

    setContextMenu({
      position,
      node
    });
  };

  const handlePaneClick = () => {
    setContextMenu(null);
  };

  const handleInspect = () => {
    if (!contextMenu?.node) return;
    setInspectNode(contextMenu.node);
    setContextMenu(null);
  };

  const closeInspectModal = () => {
    setInspectNode(null);
  };

  return (
    <div className="workspace-flow rounded shadow-sm border bg-white" ref={containerRef} style={{ position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
        nodeTypes={nodesTypes}
        onNodeClick={onNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
      >
        <MiniMap />
        <Controls />
        <Background gap={12} color="#aaa" />
      </ReactFlow>

      {contextMenu && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.position.y,
            left: contextMenu.position.x,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            zIndex: 10,
            minWidth: "160px",
            padding: "6px 0"
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {contextMenu.node?.data?.nodekind === "composite" && (
            <button
              type="button"
              className="btn btn-sm btn-link text-start w-100"
              style={{ textDecoration: "none", padding: "6px 12px" }}
              onClick={handleInspect}
            >
              Inspecter
            </button>
          )}
          {contextMenu.node?.data?.nodekind !== "composite" && (
            <div style={{ padding: "6px 12px", color: "#888", fontSize: "0.85rem" }}>
              Aucun inspecteur disponible
            </div>
          )}
        </div>
      )}

      <CompositeInspectModal
        show={Boolean(inspectNode)}
        onClose={closeInspectModal}
        compositeNode={inspectNode}
      />
    </div>
  );
}
