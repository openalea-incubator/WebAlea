import React from "react";

export default function NodeInputBoolean({ inputName, value = false, onChangeValueChanged }) {
    return (
    <div className="form-check mb-3">
        <input
        className="form-check-input"
        type="checkbox"
        checked={value}
        onChange={(e) => onChangeValueChanged?.(e.target.checked)}
        id={inputName}
        />
        <label className="form-check-label fw-semibold" htmlFor={inputName}>
        {inputName}
        </label>
    </div>
    );
}
