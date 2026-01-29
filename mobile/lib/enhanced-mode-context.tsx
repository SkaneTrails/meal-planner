/**
 * Global context for AI-enhanced recipes mode.
 * When enabled, fetches from the meal-planner database instead of default.
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface EnhancedModeContextType {
  isEnhanced: boolean;
  setIsEnhanced: (value: boolean) => void;
}

const EnhancedModeContext = createContext<EnhancedModeContextType | undefined>(undefined);

export function EnhancedModeProvider({ children }: { children: ReactNode }) {
  const [isEnhanced, setIsEnhanced] = useState(false);

  return (
    <EnhancedModeContext.Provider value={{ isEnhanced, setIsEnhanced }}>
      {children}
    </EnhancedModeContext.Provider>
  );
}

export function useEnhancedMode() {
  const context = useContext(EnhancedModeContext);
  if (context === undefined) {
    throw new Error('useEnhancedMode must be used within an EnhancedModeProvider');
  }
  return context;
}
