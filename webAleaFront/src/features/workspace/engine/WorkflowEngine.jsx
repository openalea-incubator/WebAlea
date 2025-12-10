import { WFNode, getRootNodes } from "../model/WorkflowGraph.jsx";


export class WorkflowEngine {
    constructor(graphModel = {}) {
        this.model = graphModel;  
        this.listeners = [];
    }

    bindModel(graphModel) {
        this.model = graphModel;
    }

    onUpdate(cb) {
        this.listeners.push(cb);
    }

    start() {
        if (!this.model || Object.keys(this.model).length === 0) {
            console.warn("WorkflowEngine: No model bound.");
            return;
        }

        this._emit("start");

        const rootIds = getRootNodes(Object.values(this.model));
            console.log("Root node IDs:", rootIds);
        rootIds.forEach(id => this._executeChain(id));
    }

    stop() {
        this._emit("stop");
    }

    // Execute a node and its children recursively
    _executeChain(nodeId) {
        const node = this.model.find(n => n.id === nodeId);
        if (!node) return;

        this.executeNode(node);


        setTimeout(() => {
        node.next.forEach(nextId => {
            this._executeChain(nextId);
        });
        }, 700);
    }

    // Execute a single node
    executeNode(node) {
        this._emit("node-start", node.id);

        // Retrieve input values
        const inputsValues = node.inputs.map(i => i.value);

        const result = this._executeLogic(node, inputsValues);

        // Send the result
        this._emit("node-result", { id: node.id, result });

        // Node done
        this._emit("node-done", node.id);

    }

    // Simple logic execution based on node type
    _executeLogic(node, inputsValues) {
        let result = 0;
        inputsValues.forEach(input => {
            result += input;
        });
        return result;
    }

    _emit(event, payload) {
        this.listeners.forEach(l => l(event, payload));
    }
}
