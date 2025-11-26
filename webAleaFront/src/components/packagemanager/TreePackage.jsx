export default class TreePackage {
    
    constructor(id, label, children = []) {
        this.id = id;
        this.label = label;
        this.children = children.map(child => child.serialize());
    }

    serialize() {
        return {
            id: this.id,
            label: this.label,
            children: this.children
        };
    }
}