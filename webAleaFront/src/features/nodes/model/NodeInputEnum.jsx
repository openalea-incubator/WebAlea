import React, { useState, useEffect } from "react";

/**
 * NodeInputEnum component.
 * @param {string} inputName - The name of the input.
 * @param {string} value - The value of the input.
 * @param {array} options - The options of the input.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode} - The NodeInputEnum component.
 */
export default function NodeInputEnum({ inputName, value = "", options = [], onChange, disabled = false }) {
    /**
     * State to store the internal value. It is used to store the value of the input.
     * @type {string}
     */
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal state when prop changes (when selecting a different node)
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    useEffect(() => {
        if (!internalValue && options.length > 0) {
            setInternalValue(options[0]);
        }
    }, [options, internalValue]);

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
            {options.length > 0 ? (
                <select
                    className="form-select"
                    value={internalValue || options[0]}
                    onChange={handleChange}
                    disabled={disabled}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <select className="form-select" value={internalValue} disabled>
                    <option value={internalValue}>
                        {internalValue || "Default"}
                    </option>
                </select>
            )}
        </div>
    );
}
