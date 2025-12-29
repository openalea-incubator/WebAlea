import React, { useState, useEffect } from "react";

export default function NodeInputFloat({ inputName, value = 0, onChange }) {
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal state when prop changes (when selecting a different node)
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        if (onChange) {
            onChange(parseFloat(newValue) || 0);
        }
    };

    return (
        <div className="mb-3">
            <label className="form-label fw-semibold">{inputName}</label>
            <input
                type="number"
                step="any"
                className="form-control"
                value={internalValue}
                placeholder="0.0"
                onChange={handleChange}
            />
        </div>
    );
}
