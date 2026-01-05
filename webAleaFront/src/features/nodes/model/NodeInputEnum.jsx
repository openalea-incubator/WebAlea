import React, { useState, useEffect } from "react";

export default function NodeInputEnum({ inputName, value = "", options = [], onChange }) {
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
