import PrimitiveNode from "./PrimitiveNode.jsx";

/**
 * StringNode - A custom node component for inputting and outputting a string value.
 * This node is rendered in the workflow editor and allows users to enter a string.
 *
 * @param {Object} nodeProps - The properties of the node, including id and data.
 * @param {string} nodeProps.id - The unique identifier of the node.
 * @param {Object} nodeProps.data - The data associated with the node.
 */
export default function StringNode(nodeProps) {
    const { id, data } = nodeProps;

    const parseValue = (val) => val;
    
    const validateValue = (val) => val || "";

    return (
        <PrimitiveNode
            id={id}
            data={data}
            type="string"
            borderColor="#1976d2"
            parseValue={parseValue}
            validateValue={validateValue}
            defaultValue=""
        />
    );
}
