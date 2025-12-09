import React from "react";
import NodeInputFloat from "../model/NodeInputFloat";
import NodeInputString from "../model/NodeInputStr";
import NodeInputBoolean from "../model/NodeInputBool";

export default function NodeInput({ inputs }) {
    return (
    <div className="node-inputs">
        {inputs.map((input) => {
        switch (input.type) {
            case "float":   
            return (
                <NodeInputFloat
                inputName={input.name}
                value={input.value ?? 0}
                />
            );
            case "string":
            return (
                <NodeInputString
                inputName={input.name}
                value={input.value ?? ""}
                />
            );
            case "boolean":
            return (
                <NodeInputBoolean
                inputName={input.name}
                value={input.value ?? false}
                />
            );
            default:
            return null;
        }
        })}
    </div>
    );
    }
