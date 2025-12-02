import React, { useState } from "react";

export default function NodeInputFloat({ inputName, value = "", onChangeValueChanged }) {
    const [internalValue, setInternalValue] = useState(value);

    const handleChange = (e) => {
    const val = e.target.value;
    if (/^-?\d*\.?\d*$/.test(val)) {
        setInternalValue(val);
        if (onChangeValueChanged) onChangeValueChanged(val);
    }
    };

    return (
    <div className="mb-3">
        <label className="form-label fw-semibold">{inputName}</label>
        <input
        type="text"
        className="form-control"
        value={internalValue}
        onChange={handleChange}
        placeholder="0.0"
        />
    </div>
    );
}
