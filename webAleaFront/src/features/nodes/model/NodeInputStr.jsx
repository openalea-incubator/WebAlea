import React, { useState, useEffect } from "react";

export default function NodeInputString({ inputName, value = "", onChange }) {
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
            <input
                type="text"
                className="form-control"
                value={internalValue}
                placeholder="Texte"
                onChange={handleChange}
            />
        </div>
    );
}
