import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css'; // Css perso
import WorkSpace from './components/workspace/Workspace.jsx';
import NodeDetailSection from './components/description/NodeDetailSection.jsx';
import ToolBar from './components/toolbar/ToolBar.jsx';

export default function App() {
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
              <WorkSpace />
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
