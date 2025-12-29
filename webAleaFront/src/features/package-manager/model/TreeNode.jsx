/**
 * TreeNode - Wrapper for displaying Node objects in a tree view.
 *
 * Serializes Node instances to the format expected by MUI RichTreeView.
 */
export default class TreeNode {

    constructor(node) {
        this.node = node;
    }

    /**
     * Serializes the node for RichTreeView.
     * @returns {Object} Tree item with id, label, and node reference
     */
    serialize() {
        return {
            id: this.node.id,
            label: this.node.data?.label || this.node.id,
            node: this.node
        };
    }
}