import React, { useMemo, useState } from "react";

/**
 * NodeInputDict component.
 * Allows building a dict by choosing key + value type + value, then adding it.
 * @param {string} inputName - The name of the input.
 * @param {object} value - The current dict value.
 * @param {function} onChange - The function to call when the input changes.
 * @returns {React.ReactNode}
 */
export default function NodeInputDict({ inputName, value = {}, onChange }) {
    const [keyName, setKeyName] = useState("");
    const [valueType, setValueType] = useState("string");
    const [rawValue, setRawValue] = useState("");
    const [boolValue, setBoolValue] = useState("true");

    const currentValue = useMemo(() => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return value;
        }
        return {};
    }, [value]);

    const parseValue = () => {
        if (valueType === "float") {
            const n = Number(rawValue);
            return Number.isNaN(n) ? 0 : n;
        }
        if (valueType === "boolean") {
            return boolValue === "true";
        }
        if (valueType === "enum") {
            return rawValue;
        }
        return rawValue;
    };

    const handleAdd = () => {
        if (!keyName.trim()) return;
        const next = { ...currentValue, [keyName.trim()]: parseValue() };
        if (onChange) onChange(next);
        setKeyName("");
        setRawValue("");
        setBoolValue("true");
    };

    const handleRemove = (key) => {
        const next = { ...currentValue };
        delete next[key];
        if (onChange) onChange(next);
    };

    return (
        <div className="mb-3">
            <label className="form-label fw-semibold">{inputName}</label>

            <div className="d-flex gap-2 mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Key"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                />
                <select
                    className="form-select"
                    value={valueType}
                    onChange={(e) => setValueType(e.target.value)}
                >
                    <option value="string">string</option>
                    <option value="float">float</option>
                    <option value="boolean">boolean</option>
                    <option value="enum">enum</option>
                </select>
                {valueType === "boolean" ? (
                    <select
                        className="form-select"
                        value={boolValue}
                        onChange={(e) => setBoolValue(e.target.value)}
                    >
                        <option value="true">true</option>
                        <option value="false">false</option>
                    </select>
                ) : (
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Value"
                        value={rawValue}
                        onChange={(e) => setRawValue(e.target.value)}
                    />
                )}
                <button type="button" className="btn btn-outline-primary" onClick={handleAdd}>
                    Add
                </button>
            </div>

            {Object.keys(currentValue).length === 0 ? (
                <div className="text-muted small">No entries</div>
            ) : (
                <div className="d-flex flex-column gap-1">
                    {Object.entries(currentValue).map(([k, v]) => (
                        <div key={k} className="d-flex align-items-center gap-2">
                            <code className="small">{k}</code>
                            <span className="small text-muted">=</span>
                            <span className="small">{String(v)}</span>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemove(k)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
