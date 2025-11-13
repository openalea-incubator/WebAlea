import {
  ReactFlow,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../assets/css/workspace.css'; // Css perso

export default function WorkSpace({ useNodes, useEdges, applyNodeChanges, applyEdgeChanges, connectEdges, nodesTypes }) {

  return (
    <div className="workspace-flow rounded shadow-sm border bg-white">
      <ReactFlow
        nodes={useNodes}
        edges={useEdges}
        onNodesChange={applyNodeChanges}
        onEdgesChange={applyEdgeChanges}
        onConnect={connectEdges}
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
        nodeTypes={nodesTypes}
      >
        <MiniMap />
        <Controls />
        <Background gap={12} color="#aaa" />
      </ReactFlow>
    </div>
  );
}
