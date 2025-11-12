import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
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
    <div className="min-vh-100 min-vw-100 d-flex flex-column bg-light">
      {/* HEADER */}
      <header className="bg-dark d-flex text-white py-3 shadow-sm px-4 align-items-center justify-content-between">
        <h1 className="mb-0 fs-2 fw-bold">WebAlea</h1>
        <nav className="navbar navbar-expand-lg">
          <ul className="nav">
            <li className="nav-item">
              <a className="nav-link text-white" href="#">Workplace</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#">About</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#">Contact us</a>
            </li>
          </ul>
        </nav>
      </header>

      {/* MAIN */}
      <main className="container-fluid my-4 flex-grow-1">
        {/* ToolBar */}
        <ToolBar />

        {/* Contenu principal */}
        <div className="row gx-4 gy-4 px-4 align-items-stretch">
          <div className="col-lg-9 d-flex">
            <div className="workspace-container flex-fill p-3 bg-white shadow-sm rounded">
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
          </div>
          <div className="col-lg-3 d-flex">
            <div className="node-detail-container flex-fill p-3 bg-white shadow-sm rounded">
              <NodeDetailSection />
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center py-3 mt-auto">
        <div className="container-fluid">
          © 2025 WebAlea — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
