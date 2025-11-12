import { useState, useCallback } from 'react';
import WorkSpace from './components/workspace/Workspace.jsx';
import './assets/css/app.css'; 
import PackageManager from './components/packagemanager/PackageManager.jsx';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
 
const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
  { id: 'n3', position: { x: 0, y: 200 }, data: { label: 'Node 3' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

export default function App() {

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const addNode = (node) => {
    setNodes((nds) => nds.concat(node));
  }
  
  return (
    <>
      <header className="app-header bg-dark">
        <nav className="app-navbar navbar navbar-dark bg-dark">
          <h1 className="app-title">WebAlea</h1>
        </nav>
      </header>

      <main className="app-main">
        <div className="workspace-container d-flex">
          <ReactFlowProvider>
            <PackageManager addNode={addNode} removeNode={removeNode} />
            <WorkSpace
              useNodes={nodes}
              useEdges={edges}
              applyNodeChanges={onNodesChange}
              applyEdgeChanges={onEdgesChange}
              connectEdges={onConnect}
            />
          </ReactFlowProvider>
        </div>
      </main>

      <footer className="app-footer bg-light text-center text-lg-start">
        <div className="footer-text">
          © 2024 WebAlea
        </div>
      </footer>
    </>
  );
}

