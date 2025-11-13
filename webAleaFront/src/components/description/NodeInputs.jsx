import React from "react";
import NodeInputFloat from "./NodeInputFloat";
import NodeInputString from "./NodeInputStr";
import NodeInputBoolean from "./NodeInputBool";

export default function NodeInput({ inputs, onValueChange }) {
    return (
    <div className="node-inputs">
        {inputs.map((input) => {
        switch (input.type) {
            case "float":   
            return (
                <NodeInputFloat
                key={input.name}
                inputName={input.name}
                value={input.value}
                onChangeValueChanged={(val) => onValueChange(input.name, val)}
                />
            );
            case "string":
            return (
                <NodeInputString
                key={input.name}
                inputName={input.name}
                value={input.value}
                onChangeValueChanged={(val) => onValueChange(input.name, val)}
                />
            );
            case "boolean":
            return (
                <NodeInputBoolean
                key={input.name}
                inputName={input.name}
                value={input.value}
                onChangeValueChanged={(val) => onValueChange(input.name, val)}
                />
            );
            default:
            return null;
        }
        })}
    </div>
    );
    }
