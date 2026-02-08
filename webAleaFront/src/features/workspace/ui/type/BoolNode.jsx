import React from "react";
import PrimitiveNode from "./PrimitiveNode.jsx";

/**
 * BoolNode - A custom node component for selecting and outputting a boolean value.
 * This node is rendered in the workflow editor and allows users to choose between true and false.
 * 
 * @param {Object} nodeProps - The properties of the node, including id, data, and selection state.
 * @param {string} nodeProps.id - The unique identifier of the node.
 * @param {Object} nodeProps.data - The data associated with the node.
 * @param {boolean} nodeProps.selected - Whether the node is currently selected.
 */
export default function BoolNode(nodeProps) {
    const { id, data, selected } = nodeProps;

    const parseValue = (val) => val === "true";
    
    const validateValue = (val) => Boolean(val);

    const customInput = (
        <select className="node-select w-full px-2 py-1 border rounded">
            <option value="true">true</option>
            <option value="false">false</option>
        </select>
    );

    return (
        <div data-selected={selected ? "true" : "false"}>
            <PrimitiveNode
                id={id}
                data={data}
                type="boolean"
                borderColor="#2b8a3e"
                parseValue={parseValue}
                validateValue={validateValue}
                inputElement={customInput}
                defaultValue={false}
            />
        </div>
    );
}
