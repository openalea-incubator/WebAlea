/**
 * workflowEventHandlers.js
 * 
 * Event handlers for WorkflowEngine events.
 * Separated from FlowContext for better organization and testability.
 */

import { NodeState } from '../constants/nodeState.js';
import { WorkflowEvents } from '../constants/workflowConstants.js';

/**
 * Create workflow event handlers
 * 
 * @param {Object} dependencies - Handler dependencies
 * @param {Function} dependencies.setExecutionStatus - Set execution status
 * @param {Function} dependencies.setExecutionProgress - Set execution progress
 * @param {Function} dependencies.resetAllNodesStatus - Reset all nodes status
 * @param {Function} dependencies.updateNodeStatus - Update single node status
 * @param {Function} dependencies.updateNodeOutputs - Update node outputs
 * @param {Function} dependencies.addLog - Add log entry
 * @param {Function} dependencies.getNodeById - Get node by ID
 * @returns {Function} Event handler function
 */
export function createWorkflowEventHandlers({
    setExecutionStatus,
    setExecutionProgress,
    resetAllNodesStatus,
    updateNodeStatus,
    updateNodeOutputs,
    addLog,
    getNodeById
}) {
    return (event, payload) => {
        console.log("WorkflowEngine event:", event, payload);

        switch (event) {
            case WorkflowEvents.WORKFLOW_START:
                handleWorkflowStart(payload, {
                    setExecutionStatus,
                    setExecutionProgress,
                    resetAllNodesStatus,
                    addLog
                });
                break;

            case WorkflowEvents.NODE_STATE_CHANGE:
                handleNodeStateChange(payload, { updateNodeStatus });
                break;

            case WorkflowEvents.NODE_START:
                handleNodeStart(payload, { addLog });
                break;

            case WorkflowEvents.NODE_RESULT:
                handleNodeResult(payload, {
                    updateNodeOutputs,
                    setExecutionProgress
                });
                break;

            case WorkflowEvents.NODE_DONE:
                handleNodeDone(payload, { addLog });
                break;

            case WorkflowEvents.NODE_ERROR:
                handleNodeError(payload, {
                    getNodeById,
                    addLog,
                    setExecutionProgress
                });
                break;

            case WorkflowEvents.NODE_SKIPPED:
                handleNodeSkipped(payload, { addLog });
                break;

            case WorkflowEvents.WORKFLOW_DONE:
                handleWorkflowDone(payload, {
                    setExecutionStatus,
                    addLog
                });
                break;

            case WorkflowEvents.WORKFLOW_ERROR:
                handleWorkflowError(payload, {
                    setExecutionStatus,
                    addLog
                });
                break;

            case WorkflowEvents.WORKFLOW_STOPPED:
                handleWorkflowStopped({
                    setExecutionStatus,
                    resetAllNodesStatus,
                    addLog
                });
                break;

            case WorkflowEvents.VALIDATION_ERROR:
                handleValidationError(payload, {
                    setExecutionStatus,
                    addLog
                });
                break;

            case WorkflowEvents.VALIDATION_WARNINGS:
                handleValidationWarnings(payload, { addLog });
                break;

            default:
                console.log("Unknown event:", event);
        }
    };
}

function handleWorkflowStart(payload, { setExecutionStatus, setExecutionProgress, resetAllNodesStatus, addLog }) {
    console.log("Workflow started with", payload.totalNodes, "nodes");
    setExecutionStatus(NodeState.RUNNING);
    setExecutionProgress({
        total: payload.totalNodes,
        completed: 0,
        failed: 0,
        percent: 0
    });
    resetAllNodesStatus(NodeState.PENDING);
    addLog("Workflow execution started", { totalNodes: payload.totalNodes });
}

function handleNodeStateChange(payload, { updateNodeStatus }) {
    const { id, state } = payload;
    updateNodeStatus(id, state);
}

function handleNodeStart(payload, { addLog }) {
    const { id, label } = payload;
    addLog(`Node "${label}" started`, { nodeId: id });
}

function handleNodeResult(payload, { updateNodeOutputs, setExecutionProgress }) {
    const { id, result } = payload;
    updateNodeOutputs(id, result);
    setExecutionProgress(prev => ({
        ...prev,
        completed: prev.completed + 1,
        percent: Math.round(((prev.completed + 1) / prev.total) * 100)
    }));
}

function handleNodeDone(payload, { addLog }) {
    const { id, label } = payload;
    addLog(`Node "${label}" completed`, { nodeId: id });
}

function handleNodeError(payload, { getNodeById, addLog, setExecutionProgress }) {
    const { id, error } = payload;
    const failedNode = getNodeById(id);
    const nodeLabel = failedNode?.data?.label || id;
    addLog(`Node "${nodeLabel}" failed: ${error}`, { nodeId: id, error });
    setExecutionProgress(prev => ({
        ...prev,
        failed: prev.failed + 1
    }));
}

function handleNodeSkipped(payload, { addLog }) {
    const { id, reason } = payload;
    addLog(`Node "${id}" skipped: ${reason}`, { nodeId: id });
}

function handleWorkflowDone(payload, { setExecutionStatus, addLog }) {
    if (payload.success) {
        console.log("Workflow completed successfully");
        setExecutionStatus(NodeState.COMPLETED);
        addLog("Workflow completed successfully", {
            results: Object.keys(payload.results).length
        });
    } else {
        console.log("Workflow completed with errors");
        setExecutionStatus(NodeState.ERROR);
        addLog("Workflow completed with errors");
    }
}

function handleWorkflowError(payload, { setExecutionStatus, addLog }) {
    console.error("Workflow failed:", payload.error);
    setExecutionStatus(NodeState.ERROR);
    addLog("Workflow failed: " + payload.error, { error: payload.error });
}

function handleWorkflowStopped({ setExecutionStatus, resetAllNodesStatus, addLog }) {
    console.log("Workflow stopped by user");
    setExecutionStatus(NodeState.CANCELLED);
    resetAllNodesStatus(NodeState.READY);
    addLog("Workflow stopped by user");
}

function handleValidationError(payload, { setExecutionStatus, addLog }) {
    console.error("Validation errors:", payload.errors);
    setExecutionStatus(NodeState.ERROR);
    payload.errors.forEach(err => {
        addLog(`Validation error: ${err.message}`, err);
    });
}

function handleValidationWarnings(payload, { addLog }) {
    payload.warnings.forEach(warn => {
        addLog(`Warning: ${warn.message}`, warn);
    });
}
