import { useState, useCallback } from "react";
import { LogContext } from "./LogContextDefinition.jsx";  

/**
 * LogProvider component.
 * @param {Object} children - The children components.
 * @returns {React.ReactNode} - The LogProvider component.
 */
export default function LogProvider({ children }) {
    /**
     * State to store the logs.
     * @type {Array<Object>}
     */
    const [logs, setLogs] = useState([]);

    /**
     * Add a log to the logs array.
     * @param {string} header - The header of the log.
     * @param {Object} value - The value of the log.
     */
    const addLog = useCallback((header, value) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { header, value, timestamp }]);
    }, []);

    return (
        <LogContext.Provider value={{ logs, addLog }}>
            {children}
        </LogContext.Provider>
    );
}
