/**
 * Utility class used to create and serialize React Flow Node objects.
 *
 * Each node can define:
 * - an ID
 * - a position
 * - a label
 * - a color
 * - a status
 * - metadata
 * - input and output ports
 *
 * The class also supports OpenAlea-specific nodes through:
 * - packageName
 * - nodeName
 * - callable
 * - description
 *
 * Example usage:
 *
 *  const node = new Node({
 *    id: 'n1',
 *    position: { x: 100, y: 200 },
 *    label: 'My Node',
 *    inputs: [{ id: 'in_0', name: 'x', type: 'float', interface: 'IFloat' }],
 *    outputs: [{ id: 'out_0', name: 'result', type: 'float', interface: 'IFloat' }],
 *    data: {
 *      packageName: 'openalea.math',
 *      nodeName: 'addition'
 *    }
 *  });
 *
 */
export class Node {

    /**
     * Creates a React Flow node object.
     *
     * @param {Object} props - Node properties
     * @param {string} props.id - Unique node identifier
     * @param {string} [props.label] - Node display label
     * @param {string} [props.type="custom"] - React Flow node type
     * @param {{x: number, y: number}} [props.position={x:0,y:0}] - Node position
     * @param {Object} [props.data] - Additional node data
     * @param {Array} [props.inputs] - Input port definitions
     * @param {Array} [props.outputs] - Output port definitions
     */
    constructor({ id, label, type = "custom", position = { x: 0, y: 0 }, data, inputs, outputs }) {
        this.id = id;
        this.type = type;
        this.position = position;

        this.data = {
            label: label || data?.label || null,
            color: data?.color || null,
            status: data?.status || NodeState.READY,
            metadata: data?.metadata || {},
            inputs: inputs || [],
            outputs: outputs || [],
            endpoint: data?.endpoint || null,

            // OpenAlea-specific properties
            packageName: data?.packageName || null,
            nodeName: data?.nodeName || label || null,
            callable: data?.callable || null,
            description: data?.description || '',
        };
    }

    /**
     * Serializes the node instance into a minimal plain JavaScript object
     * compatible with React Flow.
     *
     * @returns {Object|null} Serialized node object or null if ID is missing
     */
    serialize() {
        if (!this.id) return null;

        const { id, position, type, data } = this;

        return {
            id,
            type: type,
            position: position ?? { x: 0, y: 0 },
            data: {
                label: data.label ?? null,
                color: data.color ?? null,
                status: data.status ?? NodeState.READY,
                metadata: data.metadata ?? {},
                inputs: data.inputs ?? [],
                outputs: data.outputs ?? [],
                endpoint: data.endpoint ?? null,

                // OpenAlea-specific properties
                packageName: data.packageName ?? null,
                nodeName: data.nodeName ?? null,
                callable: data.callable ?? null,
                description: data.description ?? '',
            },
        };
    }

}
