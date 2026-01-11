/**
 * TreePackage component.
 * This component is used to display the package in the tree view.
 * 
 * @param {string} id - The id of the package.
 * @param {string} label - The label of the package.
 * @param {string} version - The version of the package.
 * @param {array} children - The children of the package.
 * @returns {React.ReactNode} - The TreePackage component.
 */
export default class TreePackage {
    
    constructor(id, label, version = "unknown" , children = []) {
        this.id = id;
        this.label = label;
        this.version = version;
        this.children = Array.isArray(children) ? children : [];
    }

    /**
     * Serializes the package for the tree view.
     * @returns {Object} The serialized package with id, label, version, children and children count.
     */
    serialize() {
        return {
            id: this.id,
            label: this.label,
            version: this.version,
            children: this.children.map(child => child.serialize()),
            childrenCount: this.children.length, 
        };
    }
}