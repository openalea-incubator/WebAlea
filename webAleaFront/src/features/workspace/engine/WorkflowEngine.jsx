class WorkflowEngine {
    constructor(graph) {
        this.graph = graph; // modèle 
        this.current = null;
        this.listeners = []; // UI listeners (React Flow)
    }

    onUpdate(callback) {
        this.listeners.push(callback);
    }

    start(startNodeId) {
        this.current = startNodeId;
        this._emit("start", this.current);
        this._executeNode(this.current);
    }

    _executeNode(id) {
        const node = this.graph[id];

        this._emit("node-start", id);

        // simulate processing...
        setTimeout(() => {
            this._emit("node-done", id);

            const nextNodes = node.next;
            nextNodes.forEach(n => this._executeNode(n));
        }, 500);
    }

    _emit(event, payload) {
        this.listeners.forEach(l => l(event, payload));
    }
}
