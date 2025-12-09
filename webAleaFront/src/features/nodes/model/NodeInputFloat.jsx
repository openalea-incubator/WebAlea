import React, { useState } from "react";

export default function NodeInputFloat({ inputName, value = "" }) {
    const [internalValue, setInternalValue] = useState(value);

    return (
    <div className="mb-3">
        <label className="form-label fw-semibold">{inputName}</label>
        <input
        type="text"
        className="form-control"
        value={internalValue}
        placeholder="0.0"
        readOnly
        />
    </div>
    );
}
