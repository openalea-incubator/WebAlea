import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
import PackageManager from './components/packagemanager/PackageManager.jsx';
import ConsoleLog from './components/ConsoleLog/ConsoleLog.jsx';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from './providers/FlowContext.jsx';
import { useCallback, useState } from 'react';

export default function App() {
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
        <FlowProvider>
          <div className="row gx-4 gy-4 align-items-stretch main-layout">
            {/* Package Manager  */}
            <div className="col-lg-2 d-flex">
              <div className="package-manager-container flex-fill p-3 bg-white shadow-sm rounded">
                <PackageManager/>
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
                    <WorkSpace/>
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

        </FlowProvider>
      </main>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center py-3 mt-auto">
        <div className="container-fluid">© 2025 WebAlea — Tous droits réservés</div>
      </footer>
    </div>
  );
}
