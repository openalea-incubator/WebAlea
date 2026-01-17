import React, { useState, useEffect } from "react";

/**
 * NodeInputBoolean component.
 * @param {string} inputName - The name of the input.
 * @param {boolean} value - The value of the input.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode} - The NodeInputBoolean component.
 */
export default function NodeInputBoolean({ inputName, value = false, onChange }) {
    /**
     * State to store the internal value. It is used to store the value of the input.
     * @type {boolean}
     */
    const [internalValue, setInternalValue] = useState(value);

    /**
     * Sync internal state when prop changes (when selecting a different node).
     */
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
