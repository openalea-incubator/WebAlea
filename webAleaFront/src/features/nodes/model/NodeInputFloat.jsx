import React, { useState, useEffect } from "react";

/**
 * NodeInputFloat component.
 * @param {string} inputName - The name of the input.
 * @param {number} value - The value of the input.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode} - The NodeInputFloat component.
 */
export default function NodeInputFloat({ inputName, value = 0, onChange, disabled = false }) {
    /**
     * State to store the internal value. It is used to store the value of the input.
     * @type {number}
     */
    const [internalValue, setInternalValue] = useState(value);

    /**
     * Sync internal state when prop changes (when selecting a different node).
     */
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
                disabled={disabled}
            />
        </div>
    );
}
