export default class TreeNode {
    
    constructor(node, children = []) {
        this.node = node;
        this.children = children;
    }

    serialize() {
        return {
            id: this.node.id,
            label: this.node.data.label,
            node: this.node,
            children: this.children.map(child => (typeof child.serialize === 'function' ? child.serialize() : child))
        };
    }
}