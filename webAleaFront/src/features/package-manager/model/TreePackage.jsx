export default class TreePackage {
    
    constructor(id, label, version = "unknown" , children = []) {
    this.id = id;
    this.label = label;
    this.version = version;
    this.children = Array.isArray(children) ? children : [];
    }

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