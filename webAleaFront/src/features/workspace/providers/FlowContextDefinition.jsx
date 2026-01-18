import { createContext, useContext } from 'react';

// Context for managing workflow flows
export const FlowContext = createContext(null);

// Custom hook to access the FlowContext
export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowContextProvider');
  }
  return context;
};