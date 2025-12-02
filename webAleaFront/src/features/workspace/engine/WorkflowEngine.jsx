export class WorkflowEngine {
    constructor(graphModel) {
        this.model = graphModel;  // instance de WorkflowGraph
        this.listeners = [];
    }

    onUpdate(cb) {
        this.listeners.push(cb);
    }

    start(nodeId) {
        this._emit("start", nodeId);
        this._execute(nodeId);
    }

    _execute(id) {
        const node = this.model.nodes[id];
        if (!node) return;

        this._emit("node-start", id);

        setTimeout(() => {
            this._emit("node-done", id);

            node.next.forEach(nextId => {
                this._execute(nextId);
            });
        }, 500);
    }

    executeNode(node) {
        console.log("a", node.id);
        this._emit("node-start", node.id);
        console.log("b", node.id);

        // simulate processing + result
        setTimeout(() => {
            const result = this._executeLogic(node); 
            this._emit("node-output", { id: node.id, result });

            this._emit("node-done", node.id);

        }, 500);
    }

    _executeLogic(node) {
        // exemple pour le moment
        return Math.random() * 10; 
    }


    _emit(event, payload) {
        this.listeners.forEach(l => l(event, payload));
    }
}
