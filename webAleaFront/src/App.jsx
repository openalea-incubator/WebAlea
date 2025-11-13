import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
import PackageManager from './components/packagemanager/PackageManager.jsx';
import ConsoleLog from './components/ConsoleLog/ConsoleLog.jsx';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { useCallback } from 'react';

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
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* HEADER */}
      <header className="bg-dark text-white py-3 shadow-sm px-4 d-flex align-items-center justify-content-between">
        <h1 className="mb-0 fs-2 fw-bold">WebAlea</h1>
        <nav className="navbar navbar-expand-lg">
          <ul className="nav">
            <li className="nav-item"><a className="nav-link text-white" href="#">Workplace</a></li>
            <li className="nav-item"><a className="nav-link text-white" href="#">About</a></li>
            <li className="nav-item"><a className="nav-link text-white" href="#">Contact us</a></li>
          </ul>
        </nav>
      </header>

      {/* MAIN */}
      <main className="container-fluid flex-grow-1 my-4">
        <ToolBar />

        {/* Tous les composants dans cette balise propre à ReactFlow auront accès aux données du workflow */}
        <ReactFlowProvider>
          <div className="row gx-4 gy-4 align-items-stretch main-layout">
            {/* Package Manager  */}
            <div className="col-lg-2 d-flex">
              <div className="package-manager-container flex-fill p-3 bg-white shadow-sm rounded h-100">
                <PackageManager addNode={addNode} removeNode={removeNode} />
              </div>
            </div>

            {/* Colonne principale */}
            <div className="col-lg-10 d-flex flex-column">
              {/* Ligne du workspace et node details */}
              <div className="row flex-grow-1 gx-3">
                <div className="col-lg-8 d-flex">
                  <div className="workspace-container flex-fill p-3 bg-white shadow-sm rounded">
                    <WorkSpace
                      useNodes={nodes}
                      useEdges={edges}
                      applyNodeChanges={onNodesChange}
                      applyEdgeChanges={onEdgesChange}
                      connectEdges={onConnect}
                    />
                  </div>
                </div>

                <div className="col-lg-4 d-flex">
                  <div className="node-detail-container flex-fill p-3 bg-white shadow-sm rounded">
                    <NodeDetailSection />
                  </div>
                </div>
              </div>

              {/* Ligne ConsoleLog */}
              <div className="row mt-3">
                <div className="col-12 d-flex">
                  <div className="console-log-container container-fluid min-vw-75 min-vh-25 flex-fill p-3 bg-light rounded shadow-sm">
                    <ConsoleLog />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ReactFlowProvider>
      </main>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center py-3 mt-auto">
        <div className="container-fluid">© 2025 WebAlea — Tous droits réservés</div>
      </footer>
    </div>
  );
}
