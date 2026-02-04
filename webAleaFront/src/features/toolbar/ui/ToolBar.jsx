/**
 * ToolBar.jsx
 *
 * Enhanced toolbar with WorkflowEngine support.
 *
 * Features:
 *  - Asynchronous execution of the full workflow
 *  - Progress bar with counts and error indicator
 *  - Status indicator (running, completed, failed, stopped)
 *  - Validation before execution
 */

import { useState } from "react";
import ButtonToolBar from "./ButtonToolBar.jsx";
import ImportModal from "../model/ImportModal.jsx";
import ExportModal from "../model/ExportModal.jsx";
import {
    FaUpload,
    FaDownload,
    FaInfoCircle,
    FaPlay,
    FaStop,
    FaSpinner,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import { useFlow } from "../../workspace/providers/FlowContextDefinition.jsx";
import { useLog } from "../../logger/providers/LogContextDefinition.jsx";
import { getProgressBarColor, NodeState } from "../../workspace/constants/nodeState.js";
import { saveLocalPackage } from "../../package-manager/utils/localPackages.js";

/**
 * Progress Bar Component
 * Displays the progress of workflow execution.
 *
 * @param {object} progress - Progress object with percent, completed, total, failed
 * @param {string} status - Current execution status
 * @returns {React.ReactNode} - Progress bar element
 */
function ProgressBar({ progress, status }) {

    if (status === NodeState.PENDING) return null;

    return (
        <div className="d-flex align-items-center gap-2 mx-3" style={{ minWidth: '200px' }}>
            <div
                className="progress flex-grow-1"
                style={{ height: '8px', backgroundColor: '#e9ecef' }}
            >
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                        width: `${progress.percent}%`,
                        backgroundColor: getProgressBarColor(status),
                        transition: 'width 0.3s ease'
                    }}
                />
            </div>
            <small className="text-muted" style={{ minWidth: '80px' }}>
                {progress.completed}/{progress.total}
                {progress.failed > 0 && (
                    <span className="text-danger ms-1">({progress.failed} err)</span>
                )}
            </small>
        </div>
    );
}

/**
 * Status Indicator Component
 * Displays the current status of workflow execution.
 *
 * @param {string} status - Current execution status
 * @returns {React.ReactNode} - Status indicator element
 */
function StatusIndicator({ status }) {
    const getIcon = () => {
        switch (status) {
            case NodeState.RUNNING:
                return <FaSpinner className="fa-spin text-primary" />;
            case NodeState.COMPLETED:
                return <FaCheckCircle className="text-success" />;
            case NodeState.CANCELLED:
            case NodeState.ERROR:
                return <FaExclamationTriangle className="text-danger" />;
            case NodeState.SKIPPED:
                return <FaStop className="text-secondary" />;
            default:
                return null;
        }
    };

    const getText = () => {
        switch (status) {
            case NodeState.RUNNING: return 'Running...';
            case NodeState.COMPLETED: return 'Completed';
            case NodeState.ERROR: return 'Error';
            case NodeState.CANCELLED: return 'Validation failed';
            case NodeState.SKIPPED: return 'Stopped';
            default: return '';
        }
    };

    if (status === NodeState.PENDING) return null;

    return (
        <div className="d-flex align-items-center gap-1 mx-2">
            {getIcon()}
            <small className="text-muted">{getText()}</small>
        </div>
    );
}

/**
 * ToolBar Component
 * Main toolbar with enhanced workflow execution features.
 *
 * @returns {React.ReactNode} - The ToolBar component.
 */
export default function ToolBar() {
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const {
        setNodesAndEdges,
        nodes,
        edges,
        executeWorkflow,
        stopWorkflow,
        executionStatus,
        executionProgress
    } = useFlow();

    const { addLog } = useLog();

    const isRunning = executionStatus === NodeState.RUNNING;

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleImportClick = () => setShowImportModal(true);
    const handleImportClose = () => setShowImportModal(false);
    const handleExportClick = () => setShowExportModal(true);
    const handleExportClose = () => setShowExportModal(false);

    const handleImportData = (data) => {
        try {
            const isWorkspaceExport =
                data?.export_type === "workspace" ||
                (Array.isArray(data?.nodes) && Array.isArray(data?.edges));

            const isCompositeExport =
                data?.export_type === "composite" ||
                (data?.package_name && data?.nodes && !Array.isArray(data?.nodes));

            if (isWorkspaceExport) {
                if (!data.nodes || !data.edges) {
                    throw new Error("Invalid workspace data: missing nodes or edges");
                }
                setNodesAndEdges(data.nodes || [], data.edges || []);
                setShowImportModal(false);
                addLog("Workspace imported", {
                    nodes: data.nodes.length,
                    edges: data.edges.length
                });
                return;
            }

            if (isCompositeExport) {
                const packageName = data.package_name || "local_packages";
                const nodesObj = data.nodes || {};

                const compositeNodes = Object.entries(nodesObj).map(([nodeName, nodeData]) => ({
                    name: nodeName,
                    description: nodeData?.description || "",
                    inputs: nodeData?.inputs || [],
                    outputs: nodeData?.outputs || [],
                    callable: nodeData?.callable ?? null,
                    nodekind: nodeData?.nodekind || "composite",
                    graph: nodeData?.graph ?? null,
                    implicit_output: nodeData?.implicit_output ?? false
                }));

                saveLocalPackage({
                    name: packageName,
                    nodes: compositeNodes
                });

                window.dispatchEvent(new Event("local-packages-updated"));

                setShowImportModal(false);
                addLog("Composite imported to Local Packages", {
                    package: packageName,
                    nodes: compositeNodes.length
                });
                return;
            }

            throw new Error("Unrecognized import format");
        } catch (error) {
            alert("Error importing workflow: " + error.message);
        }
    };

    /**
     * Derive exposed composite ports based on unconnected internal ports.
     * @param {Array} graphNodes
     * @param {Array} graphEdges
     * @returns {{inputs: Array, outputs: Array}}
     */
    const deriveCompositePorts = (graphNodes, graphEdges) => {
        const customNodeIds = new Set(
            graphNodes.filter(n => n?.type === "custom").map(n => n.id)
        );

        const filteredEdges = graphEdges.filter(edge =>
            customNodeIds.has(edge.source) && customNodeIds.has(edge.target)
        );

        const targetHandles = new Set();
        const sourceHandles = new Set();

        filteredEdges.forEach(edge => {
            if (edge?.target && edge?.targetHandle) {
                targetHandles.add(`${edge.target}::${edge.targetHandle}`);
            }
            if (edge?.source && edge?.sourceHandle) {
                sourceHandles.add(`${edge.source}::${edge.sourceHandle}`);
            }
        });

        const compositeInputs = [];
        const compositeOutputs = [];
        const seenInputNames = new Set();
        const seenOutputNames = new Set();

        graphNodes.forEach(node => {
            if (node?.type !== "custom") return;
            const nodeLabel = node?.data?.label || node?.id || "node";
            const inputs = node?.data?.inputs || [];
            const outputs = node?.data?.outputs || [];

            inputs.forEach((input, index) => {
                const inputId = input?.id || `port_${index}_${input?.name || "in"}`;
                const key = `${node.id}::${inputId}`;
                if (!targetHandles.has(key)) {
                    const portName = `${nodeLabel}_${input?.name || `in_${index}`}`;
                    if (!seenInputNames.has(portName)) {
                        compositeInputs.push({
                            id: `port_${compositeInputs.length}_${portName}`,
                            name: portName,
                            interface: input?.interface || "None",
                            type: input?.type || "any",
                            optional: Boolean(input?.optional),
                            desc: input?.desc || "",
                            default: input?.default ?? undefined
                        });
                        seenInputNames.add(portName);
                    }
                }
            });

            outputs.forEach((output, index) => {
                const outputId = output?.id || `port_${index}_${output?.name || "out"}`;
                const key = `${node.id}::${outputId}`;
                if (!sourceHandles.has(key)) {
                    const portName = `${nodeLabel}_${output?.name || `out_${index}`}`;
                    if (!seenOutputNames.has(portName)) {
                        compositeOutputs.push({
                            id: `port_${compositeOutputs.length}_${portName}`,
                            name: portName,
                            interface: output?.interface || "None",
                            type: output?.type || "any",
                            optional: Boolean(output?.optional),
                            desc: output?.desc || "",
                        });
                        seenOutputNames.add(portName);
                    }
                }
            });
        });

        return { inputs: compositeInputs, outputs: compositeOutputs };
    };

    /**
     * Trigger a JSON file download in the browser.
     * @param {object} data
     * @param {string} filename
     */
    const downloadJson = (data, filename) => {
        const dataStr = "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    /**
     * Export workspace or composite as JSON.
     * @param {{mode: string, packageName?: string, nodeName?: string, description?: string}} params
     */
    const handleExport = ({ mode, packageName, nodeName, description }) => {
        try {
            if (mode === "workspace") {
                const data = { export_type: "workspace", nodes, edges };
                downloadJson(data, "workflow_export.json");
                addLog("Workspace exported", { nodes: nodes.length, edges: edges.length });
                return;
            }

            const { inputs, outputs } = deriveCompositePorts(nodes, edges);
            const compositeData = {
                export_type: "composite",
                package_name: packageName,
                nodes: {
                    [nodeName]: {
                        description: description || "",
                        inputs,
                        outputs,
                        callable: null,
                        nodekind: "composite",
                        implicit_output: false,
                        graph: { nodes, edges }
                    }
                },
                has_wralea: true,
                version: 1
            };

            downloadJson(compositeData, `${packageName}__${nodeName}.json`);
            addLog("Composite exported", {
                package: packageName,
                node: nodeName,
                nodes: nodes.length,
                edges: edges.length
            });
        } catch (error) {
            alert("Error exporting workflow: " + error.message);
        }
    };

    /**
     * Handle Info. Displays information about the current workflow.
     */
    const handleInfo = () => {
        const customNodes = nodes.filter(n => n.type === 'custom');
        const primitiveNodes = nodes.filter(n => n.type !== 'custom');

        alert(
            `Workflow Info:\n` +
            `- ${customNodes.length} OpenAlea nodes\n` +
            `- ${primitiveNodes.length} primitifs nodes\n` +
            `- ${edges.length} connexions\n\n` +
            `Status: ${executionStatus}`
        );
    };

    /**
     * Handle Run. Validates and executes the workflow asynchronously.
     */
    const handleRun = async () => {
        if (isRunning) {
            console.warn("Workflow already running");
            return;
        }

        if (nodes.length === 0) {
            alert("Cannot run an empty workflow");
            return;
        }

        addLog("Starting workflow execution...", {
            nodes: nodes.length,
            edges: edges.length
        });

        try {
            const result = await executeWorkflow();

            if (result.success) {
                addLog("Workflow execution completed successfully", {
                    resultCount: Object.keys(result.results || {}).length
                });
            } else {
                addLog("Workflow execution failed", {
                    error: result.error,
                    errors: result.errors
                });
            }
        } catch (error) {
            console.error("Workflow execution error:", error);
            addLog("Workflow execution error: " + error.message, { error });
        }
    };

    /**
     * Handle Stop. Stops the currently running workflow.
     */
    const handleStop = () => {
        if (!isRunning) {
            console.warn("Workflow not running");
            return;
        }

        addLog("Stopping workflow...");
        stopWorkflow();
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <div className="row mb-4 px-4 align-items-center">
                {/* Left Button : Export/Import/Info */}
                <div className="col-md-4 d-flex gap-2 mb-2 mb-md-0">
                    <ButtonToolBar
                        icon={FaUpload}
                        onClick={handleExportClick}
                        disabled={isRunning}
                        title="Export workflow"
                    />
                    <ButtonToolBar
                        icon={FaDownload}
                        onClick={handleImportClick}
                        disabled={isRunning}
                        title="Import a workflow"
                    />
                    <ButtonToolBar
                        icon={FaInfoCircle}
                        onClick={handleInfo}
                        title="Information"
                    />
                </div>

                {/* Center: Progress Bar & Status */}
                <div className="col-md-4 d-flex justify-content-center align-items-center">
                    <ProgressBar
                        progress={executionProgress}
                        status={executionStatus}
                    />
                    <StatusIndicator status={executionStatus} />
                </div>

                {/* Right Button : Run/Stop */}
                <div className="col-md-4 d-flex gap-2 justify-content-md-end">
                    <ButtonToolBar
                        icon={isRunning ? FaSpinner : FaPlay}
                        onClick={handleRun}
                        disabled={isRunning || nodes.length === 0}
                        title={isRunning ? "Workflow running..." : "Run workflow"}
                        className={isRunning ? "fa-spin" : ""}
                        variant={isRunning ? "secondary" : "primary"}
                    />
                    <ButtonToolBar
                        icon={FaStop}
                        onClick={handleStop}
                        disabled={!isRunning}
                        title="Stop execution"
                        variant="danger"
                    />
                </div>
            </div>

            <ImportModal
                show={showImportModal}
                onClose={handleImportClose}
                onImport={handleImportData}
            />

            <ExportModal
                show={showExportModal}
                onClose={handleExportClose}
                onExport={handleExport}
            />
        </>
    );
}

export {ToolBar, ProgressBar, StatusIndicator};
