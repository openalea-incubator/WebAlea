import React, { useState, useEffect } from "react";

export default function NodeInputBoolean({ inputName, value = false, onChange }) {
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal state when prop changes (when selecting a different node)
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.checked;
        setInternalValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className="form-check mb-3">
            <input
                className="form-check-input"
                type="checkbox"
                checked={internalValue}
                id={inputName}
                onChange={handleChange}
            />
            <label className="form-check-label fw-semibold" htmlFor={inputName}>
                {inputName}
            </label>
        </div>
    );
}
