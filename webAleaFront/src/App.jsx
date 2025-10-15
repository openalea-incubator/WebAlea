import { useState, useCallback } from 'react';
import WorkSpace from './components/workspace/Workspace.jsx';
import './assets/css/app.css'; 

export default function App() {
  return (
    <>
      <header className="app-header bg-dark">
        <nav className="app-navbar navbar navbar-dark bg-dark">
          <h1 className="app-title">WebAlea</h1>
        </nav>
      </header>

      <main className="app-main">
        <div className="workspace-container">
          <WorkSpace />
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

