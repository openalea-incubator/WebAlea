import { WFNode, getRootNodes } from "../model/WorkflowGraph.jsx";
import { executeNode } from "../../../api/managerAPI.js";


export class WorkflowEngine {
    constructor(graphModel = []) {
        this.model = graphModel;
        this.listeners = [];
        this.useBackend = true; // Toggle for backend vs local execution
    }

    bindModel(graphModel) {
        this.model = graphModel;
    }

    onUpdate(cb) {
        this.listeners.push(cb);
    }

    start() {
        if (!this.model || this.model.length === 0) {
            console.warn("WorkflowEngine: No model bound.");
            return;
        }

        this._emit("start");

        const rootIds = getRootNodes(this.model);
        console.log("Root node IDs:", rootIds);
        rootIds.forEach(id => this._executeChain(id));
    }

    stop() {
        this._emit("stop");
    }

    // Execute a node and its children recursively
    async _executeChain(nodeId) {
        const node = this.model.find(n => n.id === nodeId);
        if (!node) return;

        // Attendre que le noeud courant soit terminé avant d'appeler les suivants
        await this.executeNode(node);

        // Exécuter les noeuds suivants séquentiellement
        for (const nextId of node.next) {
            await this._executeChain(nextId);
        }
    }

    // Execute a single node
    async executeNode(node) {
        this._emit("node-start", node.id);

        try {
            let result;

            if (this.useBackend && node.packageName && node.nodeName) {
                // Execution via backend API
                result = await this._executeViaBackend(node);
            } else {
                // Fallback: execution locale
                result = this._executeLocalLogic(node);
            }

            // Envoyer le résultat
            this._emit("node-result", { id: node.id, result });
            this._emit("node-done", node.id);

        } catch (error) {
            console.error(`Error executing node ${node.id}:`, error);
            this._emit("node-error", { id: node.id, error: error.message });
            this._emit("node-done", node.id);
        }
    }

    // Execute node via backend API
    async _executeViaBackend(node) {
        console.log("Executing node via backend:", node.id, node.packageName, node.nodeName);

        const response = await executeNode({
            nodeId: node.id,
            packageName: node.packageName,
            nodeName: node.nodeName,
            inputs: node.inputs || []
        });

        if (response.success) {
            console.log("Backend execution result:", response.result);
            return response.result;
        } else {
            throw new Error(response.error || "Backend execution failed");
        }
    }

    // Local logic execution (fallback)
    _executeLocalLogic(node) {
        const inputsValues = (node.inputs || []).map(i => i.value);
        console.log("Local execution for node:", node.id, "inputs:", inputsValues);

        // Simple sum as default local logic
        let result = 0;
        inputsValues.forEach(input => {
            const numValue = parseFloat(input) || 0;
            result += numValue;
        });

        console.log("Local result:", result);
        return result;
    }

    _emit(event, payload) {
        this.listeners.forEach(l => l(event, payload));
    }
}
