import { useState, useCallback } from "react";
import { LogContext } from "./LogContextDefinition.jsx";  

export function LogProvider({ children }) {
    const [logs, setLogs] = useState([]);

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
