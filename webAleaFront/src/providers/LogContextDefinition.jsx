import { createContext, useContext } from "react";

export const LogContext = createContext();

export const useLog = () => {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error("useLog must be used within a LogProvider");
    }
    return context;
};
