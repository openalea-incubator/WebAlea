import React, { useState, useEffect } from "react";

/**
 * NodeInputString component.
 * @param {string} inputName - The name of the input.
 * @param {string} value - The value of the input.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode} - The NodeInputString component.
 */
export default function NodeInputString({ inputName, value = "", onChange, disabled = false }) {
    /**
     * State to store the internal value. It is used to store the value of the input.
     * @type {string}
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
            onChange(newValue);
        }
    };

    return (
        <div className="mb-3">
            <label className="form-label fw-semibold">{inputName}</label>
            <input
                type="text"
                className="form-control"
                value={internalValue}
                placeholder="Texte"
                onChange={handleChange}
                disabled={disabled}
            />
        </div>
    );
}
