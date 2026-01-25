import PrimitiveNode from "./PrimitiveNode.jsx";

/**
 * FloatNode - A custom node component for inputting and outputting a float value.
 * This node is rendered in the workflow editor and allows users to enter a float number.
 * 
 * @param {Object} nodeProps - The properties of the node, including id and data.
 * @param {string} nodeProps.id - The unique identifier of the node.
 * @param {Object} nodeProps.data - The data associated with the node.
 */
export default function FloatNode(nodeProps) {
    const { id, data } = nodeProps;

    const parseValue = (val) => val;
    
    const validateValue = (val) => {
        const parsed = Number.parseFloat(val);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    return (
        <PrimitiveNode
            id={id}
            data={data}
            type="float"
            borderColor="#8e24aa"
            parseValue={parseValue}
            validateValue={validateValue}
            defaultValue={0}
        />
    );
}
