import { ReactFlow, Background, Controls } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

export default function App({ useNodes, useEdges, applyNodeChanges, applyEdgeChanges, connectEdges }) {

  return (
    <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={useNodes}
          edges={useEdges}
          onNodesChange={applyNodeChanges}
          onEdgesChange={applyEdgeChanges}
          onConnect={connectEdges}
          fitView>
          <Background />
          <Controls />
        </ReactFlow>
    </div>
  );
}