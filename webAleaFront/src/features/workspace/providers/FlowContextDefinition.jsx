import { createContext, useContext } from 'react';

// Création du Context
export const FlowContext = createContext(null);

// Hook personnalisé pour accéder facilement au context
export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};