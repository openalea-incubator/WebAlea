import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
import PackageManager from './components/packagemanager/PackageManager.jsx';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { useCallback } from 'react';
import CustomNode, { Node } from './components/workspace/Node.jsx';

export default function App() {

  const nodesTypes = { custom: CustomNode };

  const initialNodes = [
    new Node({ id: "n1", title: "Node 1", metadata: { info: "This is node 1", author: ["Author 1", "Author 2"] } }).serialize(),
  ];

  const initialEdges = [
    { id: 'n1-n2', source: 'n1', target: 'n2' },
  ];


  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params) => {
    if (params.source === params.target) {
      return;
    }
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const addNode = (node) => {
    setNodes((nds) => nds.concat(node.serialize()));
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

        {/* Tous les composants ci dessous contenue dans ReactFlowProvider auront accès aux noeuds et relations entre ces derniers */}
        <ReactFlowProvider>
          <div className="row gx-4 gy-4 align-items-stretch">
            {/* Package Manager */}
            <div className="col-lg-2 d-flex">
              <div className="package-manager-container flex-fill p-3 bg-white shadow-sm rounded">
                <PackageManager addNode={addNode} removeNode={removeNode} />
              </div>
            </div>
            {/* Workspace */}
            <div className="col-lg-7 d-flex">
              <div className="workspace-container flex-fill p-3 bg-white shadow-sm rounded">
                <WorkSpace
                  useNodes={nodes}
                  useEdges={edges}
                  applyNodeChanges={onNodesChange}
                  applyEdgeChanges={onEdgesChange}
                  connectEdges={onConnect}
                  nodesTypes={nodesTypes}
                />
              </div>
            </div>

            {/* Node details */}
            <div className="col-lg-3 d-flex">
              <div className="node-detail-container flex-fill p-3 bg-white shadow-sm rounded">
                <NodeDetailSection />
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
