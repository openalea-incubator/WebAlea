/**
 * useWorkflowExecution.jsx
 *
 * Hook personnalisé pour gérer l'exécution de workflows.
 * Fournit une interface simple pour exécuter, arrêter et suivre la progression.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { WorkflowEngine, WorkflowValidator, NodeState } from '../engine/WorkflowEngine.jsx';
import { buildGraphModel } from '../model/WorkflowGraph.jsx';

/**
 * États possibles de l'exécution
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
 * Hook pour gérer l'exécution de workflows
 *
 * @param {Object} options
 * @param {Function} options.onNodeStateChange - Callback quand l'état d'un node change
 * @param {Function} options.onNodeResult - Callback quand un node produit un résultat
 * @param {Function} options.onLog - Callback pour les logs
 * @returns {Object} API d'exécution
 */
export function useWorkflowExecution(options = {}) {
    const {
        onNodeStateChange,
        onNodeResult,
        onLog
    } = options;

    // État
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

    // Références
    const engineRef = useRef(null);
    const nodeStatesRef = useRef(new Map());

    // Initialiser le moteur
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
     * Log helper
     */
    const log = useCallback((message, data = null) => {
        console.log(`[WorkflowExecution] ${message}`, data || '');
        if (onLog) {
            onLog(message, data);
        }
    }, [onLog]);

    /**
     * Met à jour la progression
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

        const percent = total > 0 ? Math.round(((completed + failed + skipped) / total) * 100) : 0;

        setProgress({ total, completed, failed, skipped, percent });
    }, []);

    /**
     * Handler pour les événements du moteur
     */
    const handleEngineEvent = useCallback((event, payload) => {
        switch (event) {
            case 'workflow-start':
                log(`Workflow démarré avec ${payload.totalNodes} nodes`);
                nodeStatesRef.current.clear();
                for (const node of payload.graph) {
                    nodeStatesRef.current.set(node.id, NodeState.PENDING);
                }
                updateProgress(nodeStatesRef.current);
                break;

            case 'node-state-change':
                nodeStatesRef.current.set(payload.id, payload.state);
                updateProgress(nodeStatesRef.current);
                if (onNodeStateChange) {
                    onNodeStateChange(payload.id, payload.state);
                }
                break;

            case 'node-start':
                log(`Node "${payload.label}" démarré`, { nodeId: payload.id });
                break;

            case 'node-result':
                log(`Node "${payload.id}" terminé`, { result: payload.result });
                if (onNodeResult) {
                    onNodeResult(payload.id, payload.result);
                }
                break;

            case 'node-done':
                log(`Node "${payload.label}" complété`);
                break;

            case 'node-error':
                log(`Node "${payload.id}" en erreur: ${payload.error}`, { error: payload.error });
                setErrors(prev => [...prev, {
                    type: 'EXECUTION_ERROR',
                    nodeId: payload.id,
                    message: payload.error
                }]);
                break;

            case 'node-skipped':
                log(`Node "${payload.id}" sauté: ${payload.reason}`);
                break;

            case 'workflow-done':
                if (payload.success) {
                    log('Workflow terminé avec succès');
                    setStatus(ExecutionStatus.COMPLETED);
                } else {
                    log('Workflow terminé avec des erreurs');
                    setStatus(ExecutionStatus.FAILED);
                }
                setResults(payload.results);
                break;

            case 'workflow-error':
                log(`Workflow échoué: ${payload.error}`);
                setStatus(ExecutionStatus.FAILED);
                setErrors(prev => [...prev, {
                    type: 'WORKFLOW_ERROR',
                    message: payload.error
                }]);
                break;

            case 'workflow-stopped':
                log('Workflow arrêté par l\'utilisateur');
                setStatus(ExecutionStatus.STOPPED);
                break;

            case 'validation-error':
                log('Erreurs de validation', payload.errors);
                setErrors(payload.errors);
                break;

            case 'validation-warnings':
                log('Avertissements de validation', payload.warnings);
                setWarnings(payload.warnings);
                break;
        }
    }, [log, onNodeStateChange, onNodeResult, updateProgress]);

    /**
     * Configure le listener du moteur
     */
    useEffect(() => {
        const engine = engineRef.current;
        if (engine) {
            engine.listeners = [];
            engine.onUpdate(handleEngineEvent);
        }
    }, [handleEngineEvent]);

    /**
     * Valide le workflow sans l'exécuter
     */
    const validate = useCallback((nodes, edges) => {
        const { graph, edges: customEdges } = buildGraphModel(nodes, edges);
        const validation = WorkflowValidator.validate(graph, customEdges);

        setErrors(validation.errors);
        setWarnings(validation.warnings);

        return validation;
    }, []);

    /**
     * Exécute le workflow
     */
    const execute = useCallback(async (nodes, edges) => {
        const engine = engineRef.current;
        if (!engine) {
            log('Erreur: Moteur non initialisé');
            return { success: false, error: 'Engine not initialized' };
        }

        // Reset état
        setStatus(ExecutionStatus.VALIDATING);
        setErrors([]);
        setWarnings([]);
        setResults({});
        setProgress({ total: 0, completed: 0, failed: 0, skipped: 0, percent: 0 });

        // Construire le modèle
        const { graph, edges: customEdges } = buildGraphModel(nodes, edges);

        log('Modèle construit', { nodes: graph.length, edges: customEdges.length });

        // Lier au moteur
        engine.bindModel(graph, customEdges);

        // Exécuter
        setStatus(ExecutionStatus.RUNNING);
        const result = await engine.start();

        return result;
    }, [log]);

    /**
     * Arrête l'exécution
     */
    const stop = useCallback(() => {
        const engine = engineRef.current;
        if (engine) {
            engine.stop();
        }
    }, []);

    /**
     * Réinitialise l'état
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
        // État
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

        // Accès au moteur (pour cas avancés)
        engine: engineRef.current
    };
}

export default useWorkflowExecution;
