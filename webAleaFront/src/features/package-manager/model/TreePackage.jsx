export default class TreePackage {
    
    constructor(id, label, children = []) {
    this.id = id;
    this.label = label;
    this.children = Array.isArray(children) ? children : [];
    }

    serialize() {
    return {
        id: this.id,
        label: this.label,
        children: this.children.map(child => child.serialize()),
        childrenCount: this.children.length, 
    };
}

}