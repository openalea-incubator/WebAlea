import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
import PackageManager from './components/packagemanager/PackageManager.jsx';
import ConsoleLog from './components/ConsoleLog/ConsoleLog.jsx';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { useCallback, useState } from 'react';

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
    [setEdges],
  );

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const addNode = (node) => {
    setNodes((nds) => nds.concat(node));
  }

  const [isNodeDetailOpen, setIsNodeDetailOpen] = useState(false); // TODO : Si un node est sélectionné, mettre a true, sinon false
  const toggleNodeDetail = () => setIsNodeDetailOpen(prev => !prev);

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
      <main className="container-fluid flex-grow-1 my-3">
        <ToolBar />

        {/* Tous les composants dans cette balise propre à ReactFlow auront accès aux données du workflow */}
        <ReactFlowProvider>
          <div className="row gx-4 gy-4 align-items-stretch main-layout">
            {/* Package Manager  */}
            <div className="col-lg-2 d-flex">
              <div className="package-manager-container flex-fill p-3 bg-white shadow-sm rounded">
                <PackageManager addNode={addNode} removeNode={removeNode} />
              </div>
            </div>

            {/* Colonne principale */}
            <div className="col-lg-10 d-flex flex-column position-relative">
              <div className="row flex-grow-1 gx-3">
                {/* Workspace */}
                <div className={isNodeDetailOpen ? "col-lg-9 d-flex" : "col-lg-12 d-flex"}>
                  <div className="workspace-container flex-fill bg-white shadow-sm rounded overflow-auto transition-width"
                  style={{
                      width: isNodeDetailOpen ? '75%' : '100%',}}>
                    <WorkSpace
                      useNodes={nodes}
                      useEdges={edges}
                      applyNodeChanges={onNodesChange}
                      applyEdgeChanges={onEdgesChange}
                      connectEdges={onConnect}
                    />
                  </div>
                </div>

                {/* NodeDetailSection conditionnelle */}
                <div className={isNodeDetailOpen ? "col-lg-3 d-flex" : "d-none"}>
                  <div className="node-detail-container flex-fill p-3 bg-white shadow-sm rounded transition-width">
                    <NodeDetailSection />
                  </div>
                </div>
              </div>

              {/* ConsoleLog */}
              <div className="row mt-3">
                <div className="col-12 d-flex">
                  <div className="console-log-container flex-fill p-3 bg-white shadow-sm rounded overflow-auto">
                    <ConsoleLog />
                  </div>
                </div>
              </div>
              
            </div>
          </div>

        </ReactFlowProvider>
        <button
          className="btn btn-secondary toggle-btn-nds position-absolute"
          style={{
            top: '50%',
            right: isNodeDetailOpen ? '20%' : '2%',
            transform: 'translateY(-50%)',
            zIndex: 10
          }}
          onClick={toggleNodeDetail}
        >
          {isNodeDetailOpen ? '>' : '<'}
        </button>

      </main>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center py-3 mt-auto">
        <div className="container-fluid">© 2025 WebAlea — Tous droits réservés</div>
      </footer>
    </div>
  );
}
