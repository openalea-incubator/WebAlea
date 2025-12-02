import React from "react";

export default function NodeInputString({ inputName, value = "", onChangeValueChanged }) {
    return (
    <div className="mb-3">
        <label className="form-label fw-semibold">{inputName}</label>
        <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChangeValueChanged?.(e.target.value)}
        placeholder="Texte"
        />
    </div>
    );
}
