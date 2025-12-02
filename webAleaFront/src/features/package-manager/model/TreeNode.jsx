export default class TreeNode {
    
    constructor(node) {
        this.node = node;
    }

    serialize() {
        return {
            id: this.node.id,
            label: this.node.data.label,
            node: this.node
        };
    }
}