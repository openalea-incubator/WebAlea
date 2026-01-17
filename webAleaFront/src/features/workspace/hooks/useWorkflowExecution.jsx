/**
 * useWorkflowExecution.jsx
 *
 * Custom React hook responsible for managing workflow execution.
 * It provides a high-level API to validate, execute, stop, and monitor
 * the progress of a workflow.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { WorkflowEngine, WorkflowValidator, NodeState } from '../engine/WorkflowEngine.jsx';
import { buildGraphModel } from '../model/WorkflowGraph.jsx';

/**
 * Possible execution states for a workflow
 */
export const ExecutionStatus = {
    IDLE: 'idle',
    VALIDATING: 'validating',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    STOPPED: 'stopped'
};

/**
 * Hook used to control workflow execution lifecycle.
 *
 * @param {Object} options
 * @param {Function} [options.onNodeStateChange] - Called whenever a node state changes
 * @param {Function} [options.onNodeResult] - Called when a node produces a result
 * @param {Function} [options.onLog] - Called for logging engine events
 *
 * @returns {Object} Workflow execution API
 */
export function useWorkflowExecution(options = {}) {
    const {
        onNodeStateChange,
        onNodeResult,
        onLog
    } = options;

    /* ---------------------------------------------------------------------
     * State
     * ------------------------------------------------------------------ */

    const [status, setStatus] = useState(ExecutionStatus.IDLE);
    const [progress, setProgress] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        percent: 0
    });
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [results, setResults] = useState({});

    /* ---------------------------------------------------------------------
     * References
     * ------------------------------------------------------------------ */

    const engineRef = useRef(null);
    const nodeStatesRef = useRef(new Map());

    /**
     * Initialize the workflow engine once and clean it up on unmount
     */
    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new WorkflowEngine();
        }

        return () => {
            if (engineRef.current?.running) {
                engineRef.current.stop();
            }
        };
    }, []);

    /**
     * Centralized logging helper
     *
     * @param {string} message
     * @param {*} [data]
     */
    const log = useCallback((message, data = null) => {
        console.log(`[WorkflowExecution] ${message}`, data || '');
        if (onLog) {
            onLog(message, data);
        }
    }, [onLog]);

    /**
     * Recomputes workflow progress based on node states
     *
     * @param {Map<string, NodeState>} nodeStates
     */
    const updateProgress = useCallback((nodeStates) => {
        const total = nodeStates.size;
        let completed = 0;
        let failed = 0;
        let skipped = 0;

        for (const state of nodeStates.values()) {
            if (state === NodeState.COMPLETED) completed++;
            else if (state === NodeState.ERROR) failed++;
            else if (state === NodeState.SKIPPED) skipped++;
        }

        const percent = total > 0
            ? Math.round(((completed + failed + skipped) / total) * 100)
            : 0;

        setProgress({ total, completed, failed, skipped, percent });
    }, []);

    /**
     * Handles all events emitted by the workflow engine
     *
     * @param {string} event
     * @param {Object} payload
     */
    const handleEngineEvent = useCallback((event, payload) => {
        switch (event) {
            case 'workflow-start':
                log(`Workflow started with ${payload.totalNodes} nodes`);
                nodeStatesRef.current.clear();
                for (const node of payload.graph) {
                    nodeStatesRef.current.set(node.id, NodeState.PENDING);
                }
                updateProgress(nodeStatesRef.current);
                break;

            case 'node-state-change':
                nodeStatesRef.current.set(payload.id, payload.state);
                updateProgress(nodeStatesRef.current);
                onNodeStateChange?.(payload.id, payload.state);
                break;

            case 'node-start':
                log(`Node "${payload.label}" started`, { nodeId: payload.id });
                break;

            case 'node-result':
                log(`Node "${payload.id}" produced a result`, { result: payload.result });
                onNodeResult?.(payload.id, payload.result);
                break;

            case 'node-done':
                log(`Node "${payload.label}" completed`);
                break;

            case 'node-error':
                log(`Node "${payload.id}" failed: ${payload.error}`, { error: payload.error });
                setErrors(prev => [
                    ...prev,
                    {
                        type: 'EXECUTION_ERROR',
                        nodeId: payload.id,
                        message: payload.error
                    }
                ]);
                break;

            case 'node-skipped':
                log(`Node "${payload.id}" skipped: ${payload.reason}`);
                break;

            case 'workflow-done':
                setStatus(payload.success
                    ? ExecutionStatus.COMPLETED
                    : ExecutionStatus.FAILED
                );
                log(payload.success
                    ? 'Workflow completed successfully'
                    : 'Workflow completed with errors'
                );
                setResults(payload.results);
                break;

            case 'workflow-error':
                log(`Workflow failed: ${payload.error}`);
                setStatus(ExecutionStatus.FAILED);
                setErrors(prev => [
                    ...prev,
                    {
                        type: 'WORKFLOW_ERROR',
                        message: payload.error
                    }
                ]);
                break;

            case 'workflow-stopped':
                log('Workflow stopped by user');
                setStatus(ExecutionStatus.STOPPED);
                break;

            case 'validation-error':
                log('Validation errors detected', payload.errors);
                setErrors(payload.errors);
                break;

            case 'validation-warnings':
                log('Validation warnings detected', payload.warnings);
                setWarnings(payload.warnings);
                break;
        }
    }, [log, onNodeStateChange, onNodeResult, updateProgress]);

    /**
     * Attach the engine event listener
     */
    useEffect(() => {
        const engine = engineRef.current;
        if (engine) {
            engine.listeners = [];
            engine.onUpdate(handleEngineEvent);
        }
    }, [handleEngineEvent]);

    /**
     * Validates a workflow without executing it
     *
     * @param {Array} nodes
     * @param {Array} edges
     * @returns {Object} Validation result
     */
    const validate = useCallback((nodes, edges) => {
        const { graph, edges: customEdges } = buildGraphModel(nodes, edges);
        const validation = WorkflowValidator.validate(graph, customEdges);

        setErrors(validation.errors);
        setWarnings(validation.warnings);

        return validation;
    }, []);

    /**
     * Executes a workflow
     *
     * @param {Array} nodes
     * @param {Array} edges
     * @returns {Promise<Object>} Execution result
     */
    const execute = useCallback(async (nodes, edges) => {
        const engine = engineRef.current;

        if (!engine) {
            log('Error: workflow engine not initialized');
            return { success: false, error: 'Engine not initialized' };
        }

        // Reset execution state
        setStatus(ExecutionStatus.VALIDATING);
        setErrors([]);
        setWarnings([]);
        setResults({});
        setProgress({ total: 0, completed: 0, failed: 0, skipped: 0, percent: 0 });

        // Build execution model
        const { graph, edges: customEdges } = buildGraphModel(nodes, edges);
        log('Workflow model built', { nodes: graph.length, edges: customEdges.length });

        // Bind model and start execution
        engine.bindModel(graph, customEdges);
        setStatus(ExecutionStatus.RUNNING);

        return await engine.start();
    }, [log]);

    /**
     * Stops the current workflow execution
     */
    const stop = useCallback(() => {
        engineRef.current?.stop();
    }, []);

    /**
     * Resets the hook state to its initial values
     */
    const reset = useCallback(() => {
        setStatus(ExecutionStatus.IDLE);
        setProgress({ total: 0, completed: 0, failed: 0, skipped: 0, percent: 0 });
        setErrors([]);
        setWarnings([]);
        setResults({});
        nodeStatesRef.current.clear();
    }, []);

    return {
        // State
        status,
        progress,
        errors,
        warnings,
        results,
        isRunning: status === ExecutionStatus.RUNNING,
        isIdle: status === ExecutionStatus.IDLE,

        // Actions
        execute,
        stop,
        reset,
        validate,

        // Advanced usage
        engine: engineRef.current
    };
}

export default useWorkflowExecution;
