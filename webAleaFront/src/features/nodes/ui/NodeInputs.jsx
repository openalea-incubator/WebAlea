import React from "react";
import NodeInputFloat from "../model/NodeInputFloat";
import NodeInputString from "../model/NodeInputStr";
import NodeInputBoolean from "../model/NodeInputBool";

export default function NodeInput({ inputs, onInputChange }) {

    const handleChange = (inputId, newValue) => {
        if (onInputChange) {
            onInputChange(inputId, newValue);
        }
    };

    return (
        <div className="node-inputs">
            {inputs.map((input) => {
                // Use input.id as key for proper React reconciliation
                const key = input.id || input.name;

                switch (input.type) {
                    case "float":
                        return (
                            <NodeInputFloat
                                key={key}
                                inputName={input.name}
                                value={input.value ?? 0}
                                onChange={(val) => handleChange(input.id, val)}
                            />
                        );
                    case "string":
                        return (
                            <NodeInputString
                                key={key}
                                inputName={input.name}
                                value={input.value ?? ""}
                                onChange={(val) => handleChange(input.id, val)}
                            />
                        );
                    case "boolean":
                        return (
                            <NodeInputBoolean
                                key={key}
                                inputName={input.name}
                                value={input.value ?? false}
                                onChange={(val) => handleChange(input.id, val)}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}
