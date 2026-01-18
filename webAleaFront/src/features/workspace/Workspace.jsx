import {
  ReactFlow,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../assets/css/workspace.css'; // Css perso
import { useFlow } from './providers/FlowContextDefinition.jsx';

/**
 * WorkSpace - The main workspace component that renders the flow editor.
 * It utilizes ReactFlow to display nodes and edges, and provides controls for interaction.
 * The component retrieves nodes, edges, and related handlers from the Flow context.
 */
export default function WorkSpace() {

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, nodesTypes, onNodeClick } = useFlow();

  return (
    <div className="workspace-flow rounded shadow-sm border bg-white">
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
      >
        <MiniMap />
        <Controls />
        <Background gap={12} color="#aaa" />
      </ReactFlow>
    </div>
  );
}
