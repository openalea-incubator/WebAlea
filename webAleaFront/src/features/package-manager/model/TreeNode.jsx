export default class TreeNode {
    
    constructor(node) {
        this.node = node;
    }

    serialize() {
        return {
            id: this.node.name,
            label: this.node.name,
            node: this.node
        };
    }
}