/**
 * WorkflowEngine.jsx
 *
 * Moteur d'exécution asynchrone avec gestion complète des dépendances.
 *
 * Caractéristiques:
 * - Exécution parallèle des branches indépendantes
 * - Attente automatique de tous les inputs avant exécution
 * - Détection de cycles
 * - Arrêt propre avec AbortController
 * - Feedback temps réel via événements
 */

import { executeNode } from "../../../api/runnerAPI.js";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

/**
 * États possibles d'un node pendant l'exécution
 */
export const NodeState = {
    PENDING: 'pending',     // En attente de dépendances
    READY: 'ready',         // Prêt à s'exécuter (tous inputs reçus)
    RUNNING: 'running',     // En cours d'exécution
    COMPLETED: 'completed', // Terminé avec succès
    ERROR: 'error',         // Terminé avec erreur
    SKIPPED: 'skipped',     // Sauté (dépendance en erreur)
    CANCELLED: 'cancelled'  // Annulé par l'utilisateur
};

// =============================================================================
// WORKFLOW VALIDATOR
// =============================================================================

/**
 * Valide un workflow avant exécution
 */
export class WorkflowValidator {
    /**
     * Valide le workflow complet
     * @param {Array} graph - Liste des WFNodes
     * @param {Array} edges - Liste des edges entre custom nodes
     * @returns {{ valid: boolean, errors: Array, warnings: Array }}
     */
    static validate(graph, edges) {
        const errors = [];
        const warnings = [];

        // 1. Vérifier qu'il y a des nodes
        if (!graph || graph.length === 0) {
            errors.push({ type: 'EMPTY_WORKFLOW', message: 'Le workflow est vide' });
            return { valid: false, errors, warnings };
        }

        // 2. Détecter les cycles
        const cycleResult = this.detectCycle(graph, edges);
        if (cycleResult.hasCycle) {
            errors.push({
                type: 'CYCLE_DETECTED',
                message: 'Le workflow contient un cycle',
                nodes: cycleResult.cycleNodes
            });
        }

        // 3. Vérifier les inputs obligatoires non connectés/non remplis
        graph.forEach(node => {
            (node.inputs || []).forEach(input => {
                const isConnected = edges.some(e =>
                    e.target === node.id && e.targetHandle === input.id
                );
                const hasValue = input.value !== undefined && input.value !== null;
                const isOptional = input.optional === true;

                if (!isConnected && !hasValue && !isOptional) {
                    errors.push({
                        type: 'UNCONNECTED_INPUT',
                        nodeId: node.id,
                        inputId: input.id,
                        message: `Input "${input.name}" du node "${node.label}" non connecté et sans valeur`
                    });
                }
            });
        });

        // 4. Vérifier les nodes sans package (sauf primitives)
        graph.forEach(node => {
            if (!node.packageName && node.type === 'custom') {
                warnings.push({
                    type: 'MISSING_PACKAGE',
                    nodeId: node.id,
                    message: `Node "${node.label}" n'a pas de package défini`
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Détecte les cycles dans le graphe (DFS)
     */
    static detectCycle(graph, edges) {
        const visited = new Set();
        const recursionStack = new Set();
        const cycleNodes = [];

        // Construire la map d'adjacence
        const adjacency = new Map();
        graph.forEach(node => adjacency.set(node.id, []));
        edges.forEach(edge => {
            if (adjacency.has(edge.source)) {
                adjacency.get(edge.source).push(edge.target);
            }
        });

        const dfs = (nodeId, path = []) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const neighbors = adjacency.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const result = dfs(neighbor, [...path]);
                    if (result) return result;
                } else if (recursionStack.has(neighbor)) {
                    // Cycle trouvé
                    const cycleStart = path.indexOf(neighbor);
                    return path.slice(cycleStart);
                }
            }

            recursionStack.delete(nodeId);
            return null;
        };

        for (const node of graph) {
            if (!visited.has(node.id)) {
                const cycle = dfs(node.id);
                if (cycle) {
                    return { hasCycle: true, cycleNodes: cycle };
                }
            }
        }

        return { hasCycle: false, cycleNodes: [] };
    }
}

// =============================================================================
// DEPENDENCY TRACKER
// =============================================================================

/**
 * Suit l'état des dépendances de chaque node
 */
class DependencyTracker {
    constructor(graph, edges) {
        this.graph = graph;
        this.edges = edges;

        // Map: nodeId -> Set de nodeIds dont on attend les résultats
        this.pendingDependencies = new Map();

        // Map: nodeId -> Map(inputId -> { received: boolean, value: any })
        this.inputStates = new Map();

        this._initialize();
    }

    _initialize() {
        // Pour chaque node, identifier les dépendances (custom nodes sources)
        for (const node of this.graph) {
            const dependencies = new Set();
            const inputStateMap = new Map();

            // Initialiser chaque input
            for (const input of (node.inputs || [])) {
                inputStateMap.set(input.id, {
                    received: false,
                    value: input.value,
                    sourceNodeId: null,
                    sourceOutputId: null
                });
            }

            // Trouver les edges entrantes pour ce node
            const incomingEdges = this.edges.filter(e => e.target === node.id);
            for (const edge of incomingEdges) {
                dependencies.add(edge.source);

                // Marquer cet input comme dépendant d'une connexion
                const inputState = inputStateMap.get(edge.targetHandle);
                if (inputState) {
                    inputState.sourceNodeId = edge.source;
                    inputState.sourceOutputId = edge.sourceHandle;
                    // Ne pas marquer comme reçu - on attend le résultat
                }
            }

            this.pendingDependencies.set(node.id, dependencies);
            this.inputStates.set(node.id, inputStateMap);
        }
    }

    /**
     * Vérifie si un node est prêt à s'exécuter
     */
    isReady(nodeId) {
        const pending = this.pendingDependencies.get(nodeId);
        return pending && pending.size === 0;
    }

    /**
     * Retourne tous les nodes prêts à s'exécuter
     */
    getReadyNodes() {
        const ready = [];
        for (const node of this.graph) {
            if (this.isReady(node.id)) {
                ready.push(node.id);
            }
        }
        return ready;
    }

    /**
     * Marque un node comme complété et propage ses outputs
     * @returns {Array} Liste des nodeIds qui deviennent prêts
     */
    markCompleted(nodeId, outputs) {
        const newlyReady = [];

        // Trouver les edges sortantes de ce node
        const outgoingEdges = this.edges.filter(e => e.source === nodeId);

        for (const edge of outgoingEdges) {
            const targetNodeId = edge.target;

            // Retirer cette dépendance du node cible
            const pending = this.pendingDependencies.get(targetNodeId);
            if (pending) {
                pending.delete(nodeId);
            }

            // Injecter la valeur de l'output dans l'input cible
            const inputStates = this.inputStates.get(targetNodeId);
            if (inputStates) {
                const inputState = inputStates.get(edge.targetHandle);
                if (inputState) {
                    // Parser l'index de l'output (ex: "output_0" → 0)
                    const outputIndex = parseInt(edge.sourceHandle.match(/output_(\d+)/)?.[1] || 0, 10);
                    const outputValue = outputs[outputIndex]?.value;

                    inputState.received = true;
                    inputState.value = outputValue;
                }
            }

            // Vérifier si le node cible devient prêt
            if (this.isReady(targetNodeId)) {
                newlyReady.push(targetNodeId);
            }
        }

        return newlyReady;
    }

    /**
     * Récupère les inputs résolus pour un node
     */
    getResolvedInputs(nodeId) {
        const node = this.graph.find(n => n.id === nodeId);
        if (!node) return [];

        const inputStates = this.inputStates.get(nodeId);
        if (!inputStates) return node.inputs || [];

        // Construire la liste des inputs avec valeurs résolues
        return (node.inputs || []).map(input => {
            const state = inputStates.get(input.id);
            return {
                ...input,
                value: state ? state.value : input.value
            };
        });
    }

    /**
     * Marque tous les successeurs d'un node en erreur comme "skipped"
     */
    getSuccessors(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const successors = [];
        const outgoingEdges = this.edges.filter(e => e.source === nodeId);

        for (const edge of outgoingEdges) {
            successors.push(edge.target);
            successors.push(...this.getSuccessors(edge.target, visited));
        }

        return [...new Set(successors)];
    }
}

// =============================================================================
// WORKFLOW ENGINE 
// =============================================================================

export class WorkflowEngine {
    constructor() {
        this.graph = [];
        this.edges = [];
        this.dependencyTracker = null;

        // État d'exécution
        this.running = false;
        this.abortController = null;
        this.nodeStates = new Map();  // nodeId -> NodeState
        this.results = {};            // nodeId -> outputs[]

        // Listeners
        this.listeners = [];

        // Promesses pour la synchronisation
        this.executionPromises = new Map();  // nodeId -> Promise
        this.nodeResolvers = new Map();      // nodeId -> { resolve, reject }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Lie le modèle de graphe au moteur
     */
    bindModel(graph, edges) {
        this.graph = graph;
        this.edges = edges;
        this.reset();
    }

    /**
     * Enregistre un listener pour les événements
     */
    onUpdate(callback) {
        this.listeners.push(callback);
    }

    /**
     * Réinitialise l'état du moteur
     */
    reset() {
        this.results = {};
        this.nodeStates.clear();
        this.executionPromises.clear();
        this.nodeResolvers.clear();

        // Initialiser tous les nodes à PENDING
        for (const node of this.graph) {
            this.nodeStates.set(node.id, NodeState.PENDING);
        }
    }

    /**
     * Démarre l'exécution du workflow
     */
    async start() {
        if (this.running) {
            console.warn("WorkflowEngine: Already running");
            return { success: false, error: "Already running" };
        }

        if (!this.graph || this.graph.length === 0) {
            console.warn("WorkflowEngine: No model bound");
            return { success: false, error: "No model bound" };
        }

        // Validation
        const validation = WorkflowValidator.validate(this.graph, this.edges);
        if (!validation.valid) {
            this._emit("validation-error", { errors: validation.errors });
            return { success: false, errors: validation.errors };
        }

        if (validation.warnings.length > 0) {
            this._emit("validation-warnings", { warnings: validation.warnings });
        }

        // Initialisation
        this.running = true;
        this.abortController = new AbortController();
        this.reset();
        this.dependencyTracker = new DependencyTracker(this.graph, this.edges);

        this._emit("workflow-start", {
            totalNodes: this.graph.length,
            graph: this.graph.map(n => ({ id: n.id, label: n.label }))
        });

        console.log("WorkflowEngine: Starting with", this.graph.length, "nodes");

        try {
            // Trouver les nodes initialement prêts (roots)
            const initialReady = this.dependencyTracker.getReadyNodes();
            console.log("WorkflowEngin2: Initial ready nodes:", initialReady);

            if (initialReady.length === 0) {
                throw new Error("Aucun node racine trouvé - vérifiez les connexions");
            }

            // Marquer tous les nodes comme "queued"
            for (const node of this.graph) {
                this._setNodeState(node.id, NodeState.PENDING);
            }

            // Exécuter les nodes prêts en parallèle et attendre la complétion
            await this._executeReadyNodes(initialReady);

            // Attendre que tous les nodes soient terminés
            await this._waitForAllNodes();

            // Vérifier s'il reste des nodes non exécutés (cycle ou erreur)
            const unfinished = [...this.nodeStates.entries()]
                .filter(([_, state]) => state === NodeState.PENDING || state === NodeState.READY)
                .map(([id]) => id);

            if (unfinished.length > 0) {
                console.warn("WorkflowEngine: Nodes not executed:", unfinished);
            }

            const hasErrors = [...this.nodeStates.values()].some(s => s === NodeState.ERROR);

            this._emit("workflow-done", {
                success: !hasErrors,
                results: this.results,
                states: Object.fromEntries(this.nodeStates)
            });

            return { success: !hasErrors, results: this.results };

        } catch (error) {
            console.error("WorkflowEngine: Workflow failed:", error);
            this._emit("workflow-error", { error: error.message });
            return { success: false, error: error.message };

        } finally {
            this.running = false;
            this.abortController = null;
        }
    }

    /**
     * Arrête l'exécution du workflow
     */
    stop() {
        if (!this.running) return;

        console.log("WorkflowEngine: Stopping workflow");
        this.running = false;

        if (this.abortController) {
            this.abortController.abort();
        }

        // Annuler tous les nodes en attente
        for (const [nodeId, state] of this.nodeStates) {
            if (state === NodeState.PENDING || state === NodeState.READY || state === NodeState.RUNNING) {
                this._setNodeState(nodeId, NodeState.CANCELLED);

                // Rejeter la promesse si elle existe
                const resolver = this.nodeResolvers.get(nodeId);
                if (resolver) {
                    resolver.reject(new Error("Workflow stopped"));
                }
            }
        }

        this._emit("workflow-stopped", {});
    }

    /**
     * Exécute un node unique (pour tests ou exécution manuelle)
     */
    async executeNodeManual(node) {
        this._emit("node-start", { id: node.id, label: node.label });

        try {
            const outputs = await this._executeViaBackend(node, node.inputs || []);
            this._emit("node-result", { id: node.id, result: outputs });
            this._emit("node-done", { id: node.id });
            return outputs;
        } catch (error) {
            this._emit("node-error", { id: node.id, error: error.message });
            throw error;
        }
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Exécute une liste de nodes prêts en parallèle
     */
    async _executeReadyNodes(readyNodeIds) {
        const executions = readyNodeIds.map(nodeId => this._executeNode(nodeId));
        await Promise.allSettled(executions);
    }

    /**
     * Attend que tous les nodes soient terminés
     */
    async _waitForAllNodes() {
        const allPromises = [...this.executionPromises.values()];
        await Promise.allSettled(allPromises);
    }

    /**
     * Exécute un node et déclenche ses successeurs
     */
    async _executeNode(nodeId) {
        // Créer une promesse pour ce node
        const nodePromise = new Promise((resolve, reject) => {
            this.nodeResolvers.set(nodeId, { resolve, reject });
        });
        this.executionPromises.set(nodeId, nodePromise);

        try {
            // Vérifier si le workflow a été stoppé
            if (!this.running) {
                throw new Error("Workflow stopped");
            }

            const node = this.graph.find(n => n.id === nodeId);
            if (!node) {
                throw new Error(`Node ${nodeId} not found`);
            }

            // Marquer comme running
            this._setNodeState(nodeId, NodeState.RUNNING);
            this._emit("node-start", { id: nodeId, label: node.label });

            // Récupérer les inputs résolus (avec les valeurs propagées)
            const resolvedInputs = this.dependencyTracker.getResolvedInputs(nodeId);

            console.log(`WorkflowEngine: Executing ${nodeId} (${node.label}) with inputs:`,
                resolvedInputs.map(i => ({ name: i.name, value: i.value })));

            // Exécuter le node
            let outputs;
            if (node.packageName && node.nodeName) {
                outputs = await this._executeViaBackend(node, resolvedInputs);
            } else {
                // Node primitif ou sans backend - retourner les valeurs directement
                outputs = (node.outputs || []).map((output, index) => ({
                    index,
                    name: output.name || `output_${index}`,
                    value: output.value,
                    type: output.type || 'any'
                }));
            }

            // Stocker les résultats
            this.results[nodeId] = outputs;

            // Marquer comme complété
            this._setNodeState(nodeId, NodeState.COMPLETED);
            this._emit("node-result", { id: nodeId, result: outputs });
            this._emit("node-done", { id: nodeId, label: node.label });

            // Résoudre la promesse
            const resolver = this.nodeResolvers.get(nodeId);
            if (resolver) resolver.resolve(outputs);

            // Propager les résultats et exécuter les nodes qui deviennent prêts
            const newlyReady = this.dependencyTracker.markCompleted(nodeId, outputs);

            if (newlyReady.length > 0 && this.running) {
                console.log(`WorkflowEngine: Nodes now ready after ${nodeId}:`, newlyReady);
                // Exécuter les nouveaux nodes prêts en parallèle
                await this._executeReadyNodes(newlyReady);
            }

            return outputs;

        } catch (error) {
            console.error(`WorkflowEngine: Node ${nodeId} failed:`, error);

            // Marquer comme erreur
            this._setNodeState(nodeId, NodeState.ERROR);
            this._emit("node-error", { id: nodeId, error: error.message });

            // Rejeter la promesse
            const resolver = this.nodeResolvers.get(nodeId);
            if (resolver) resolver.reject(error);

            // Marquer tous les successeurs comme skipped
            const successors = this.dependencyTracker.getSuccessors(nodeId);
            for (const successorId of successors) {
                if (this.nodeStates.get(successorId) === NodeState.PENDING) {
                    this._setNodeState(successorId, NodeState.SKIPPED);
                    this._emit("node-skipped", {
                        id: successorId,
                        reason: `Dependency ${nodeId} failed`
                    });

                    // Résoudre la promesse du successor comme skipped
                    const successorResolver = this.nodeResolvers.get(successorId);
                    if (successorResolver) {
                        successorResolver.resolve(null);
                    }
                }
            }

            throw error;
        }
    }

    /**
     * Exécute un node via le backend
     */
    async _executeViaBackend(node, inputs) {
        console.log(`WorkflowEngine: Backend call for ${node.id}`, {
            package: node.packageName,
            node: node.nodeName,
            inputs: inputs
        });

        const response = await executeNode({
            nodeId: node.id,
            packageName: node.packageName,
            nodeName: node.nodeName,
            inputs: inputs
        });

        if (response.success) {
            return response.outputs || [];
        } else {
            throw new Error(response.error || `Execution failed for ${node.id}`);
        }
    }

    /**
     * Met à jour l'état d'un node
     */
    _setNodeState(nodeId, state) {
        this.nodeStates.set(nodeId, state);
        this._emit("node-state-change", { id: nodeId, state });
    }

    /**
     * Émet un événement à tous les listeners
     */
    _emit(event, payload) {
        for (const listener of this.listeners) {
            try {
                listener(event, payload);
            } catch (e) {
                console.error("WorkflowEngine: Listener error:", e);
            }
        }
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calcule l'ordre topologique d'exécution (Kahn's algorithm)
 * Utile pour afficher l'ordre prévu ou pour debugging
 */
export function computeTopologicalOrder(graph, edges) {
    const inDegree = new Map();
    const adjacency = new Map();

    // Initialiser
    graph.forEach(node => {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    });

    // Calculer les degrés entrants
    edges.forEach(edge => {
        const current = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, current + 1);

        if (adjacency.has(edge.source)) {
            adjacency.get(edge.source).push(edge.target);
        }
    });

    // File des nodes sans dépendances
    const queue = [];
    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) queue.push(nodeId);
    });

    // Tri topologique
    const order = [];
    while (queue.length > 0) {
        const nodeId = queue.shift();
        order.push(nodeId);

        const neighbors = adjacency.get(nodeId) || [];
        for (const neighbor of neighbors) {
            const newDegree = inDegree.get(neighbor) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    // Vérifier les cycles
    if (order.length !== graph.length) {
        throw new Error("Cycle detected in workflow");
    }

    return order;
}

export default WorkflowEngine;
