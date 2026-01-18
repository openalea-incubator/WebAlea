import React, { useState, useEffect } from "react";

/**
 * NodeInputEnum component.
 * @param {string} inputName - The name of the input.
 * @param {string} value - The value of the input.
 * @param {array} options - The options of the input.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode} - The NodeInputEnum component.
 */
export default function NodeInputEnum({ inputName, value = "", options = [], onChange }) {
    /**
     * State to store the internal value. It is used to store the value of the input.
     * @type {string}
     */
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal state when prop changes (when selecting a different node)
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
            <select
                className="form-select"
                value={internalValue}
                onChange={handleChange}
            >
                {options.length === 0 && (
                    <option value="">-- No options --</option>
                )}
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
