import React from "react";

export default function NodeInputBoolean({ inputName, value = false }) {
    return (
    <div className="form-check mb-3">
        <input
        className="form-check-input"
        type="checkbox"
        checked={value}
        id={inputName}
        readOnly
        />
        <label className="form-check-label fw-semibold" htmlFor={inputName}>
        {inputName}
        </label>
    </div>
    );
}
