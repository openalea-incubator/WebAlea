import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/app.css';
import WorkSpace from './features/workspace/Workspace.jsx';
import NodeDetailSection from './features/nodes/ui/sidebar_detail/NodeDetailSection.jsx';
import {ToolBar} from './features/toolbar/ui/ToolBar.jsx';
import PackageManager from './features/package-manager/ui/PackageManager.jsx';
import ConsoleLog from './features/logger/ui/ConsoleLog.jsx';
import { useState, useEffect } from 'react';
import { useFlow } from './features/workspace/providers/FlowContextDefinition.jsx';

/**
 * App - The main application component that structures the WebAlea interface.
 * It includes the header, main workspace area, sidebar, node detail section, and footer.
 * The component manages the state of the node detail section visibility based on the selected node.
 */
export default function App() {
    const [isNodeDetailOpen, setIsNodeDetailOpen] = useState(false);
    const toggleNodeDetail = () => setIsNodeDetailOpen(prev => !prev);
    const { currentNode } = useFlow();

    useEffect(() => {
        if (!currentNode) {
            setIsNodeDetailOpen(false);
        } else {
            setIsNodeDetailOpen(true);
        }
    }, [currentNode]);

    return (
        <div className="app-container">
            {/* HEADER */}
            <header className="app-header">
                <h1>WebAlea</h1>
                <nav>
                    <ul>
                        <li><a href="#">Workplace</a></li>
                        <li><a href="#">About</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </nav>
            </header>

            {/* MAIN */}
            <main className="app-main">
                {/* Toolbar */}
                <div className="toolbar-row">
                    <ToolBar />
                </div>

                {/* Content */}
                <div className="content-row">
                    {/* Sidebar - Package Manager */}
                    <div className="sidebar-column">
                        <div className="package-manager-container">
                            <PackageManager />
                        </div>
                    </div>

                    {/* Main Column */}
                    <div className="main-column">
                        {/* Workspace Row */}
                        <div className="workspace-row">
                            <div className="workspace-container">
                                <WorkSpace />
                            </div>

                            {/* Node Detail */}
                            <div className={`node-detail-container ${!isNodeDetailOpen ? 'hidden' : ''}`}>
                                {currentNode && <NodeDetailSection />}
                            </div>

                            {/* Toggle Button */}
                            {currentNode && (
                                <button
                                    className={`toggle-btn-nds ${isNodeDetailOpen ? 'open' : ''}`}
                                    onClick={toggleNodeDetail}
                                >
                                    {isNodeDetailOpen ? '>' : '<'}
                                </button>
                            )}
                        </div>

                        {/* Console Row */}
                        <div className="console-row">
                            <div className="console-log-container">
                                <ConsoleLog />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="app-footer">
                © 2026 WebAlea — All rights reserved.
            </footer>
        </div>
    );
}
