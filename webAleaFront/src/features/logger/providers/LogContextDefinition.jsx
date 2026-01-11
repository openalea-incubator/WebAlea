import { createContext, useContext } from "react";

/**
 * LogContext definition.
 * @type {React.Context<Object>}
 */
export const LogContext = createContext();

/**
 * Hook to use the LogContext.
 * @returns {Object} - The LogContext.
 */
export function useLog() {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error("useLog must be used within a LogProvider");
    }
    return context;
};
