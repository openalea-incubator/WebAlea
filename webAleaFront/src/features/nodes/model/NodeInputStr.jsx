import React from "react";

export default function NodeInputString({ inputName, value = "" }) {
    return (
    <div className="mb-3">
        <label className="form-label fw-semibold">{inputName}</label>
        <input
        type="text"
        className="form-control"
        value={value}
        placeholder="Texte"
        readOnly
        />
    </div>
    );
}
