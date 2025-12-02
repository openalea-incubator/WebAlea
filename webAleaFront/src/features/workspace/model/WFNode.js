

export class WFNode {
    constructor({ id, type, data, next = [] }) {
    this.id = id;
    this.type = type;       // FLOAT, BOOL, STRING…
    this.data = data;   // data
    this.next = next;       // tableau des enfants directs
    }
}
