import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';
import PackageManager from './components/packagemanager/PackageManager.jsx';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from './providers/FlowContext.jsx';

export default function App() {

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

        {/* Tous les composants ci dessous contenue dans FlowProvider auront accès aux noeuds et relations entre ces derniers */}
        <FlowProvider>
          <div className="row gx-4 gy-4 align-items-stretch">
            {/* Package Manager */}
            <div className="col-lg-2 d-flex">
              <div className="package-manager-container flex-fill p-3 bg-white shadow-sm rounded">
                <PackageManager/>
              </div>
            </div>
            {/* Workspace */}
            <div className="col-lg-7 d-flex">
              <div className="workspace-container flex-fill p-3 bg-white shadow-sm rounded">
                <WorkSpace/>
              </div>
            </div>

            {/* Node details */}
            <div className="col-lg-3 d-flex">
              <div className="node-detail-container flex-fill p-3 bg-white shadow-sm rounded">
                <NodeDetailSection />
              </div>
            </div>
          </div>
        </FlowProvider>
      </main>

      {/* FOOTER */}
      <footer className="footer bg-dark text-white text-center py-3 mt-auto">
        <div className="container-fluid">© 2025 WebAlea — Tous droits réservés</div>
      </footer>
    </div>
  );
}
