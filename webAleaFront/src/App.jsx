import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css';
import WorkSpace from './components/workspace/Workspace.jsx';

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
      <div className="container-fluid mx-auto my-4 justify-content-center align-items-center">
        <div className="container d-flex w-100">
          <div className="container d-flex gap-2 me-auto">
            <button className="btn btn-primary w-100">Import workflow</button>
            <button className="btn btn-primary w-100">Export workflow</button>
            <button className="btn btn-secondary w-100">Informations</button>
          </div>
          <div className="container d-flex gap-2 ms-auto">
            <button className="btn btn-success w-100">Run workflow</button>
            <button className="btn btn-danger w-100">Stop workflow</button>
          </div>
        </div>
        <div className="container-fluid d-flex justify-content-center align-items-center my-4 mx-auto">
              <WorkSpace /> 
        </div>
      </div>


      {/* FOOTER */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container small">
          © 2025 WebAlea — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
