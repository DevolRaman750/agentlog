import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Dimensions } from 'react-native';

interface ResponsiveContextType {
  screenWidth: number;
  screenHeight: number;
  isSidebarLayout: boolean;
  showMobileDropdown: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType>({
  screenWidth: 0,
  screenHeight: 0,
  isSidebarLayout: false,
  showMobileDropdown: false,
});

// Breakpoints
const DESKTOP_BREAKPOINT = 768;
// Remove the separate mobile dropdown breakpoint - now all non-desktop screens use dropdown
// const MOBILE_DROPDOWN_BREAKPOINT = 600;

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  // Use refs to prevent unnecessary re-renders
  const dimensionsRef = useRef(dimensions);

  useEffect(() => {
    // Debounce dimension changes to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout;
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only update if dimensions actually changed significantly
        const widthDiff = Math.abs(window.width - dimensionsRef.current.width);
        const heightDiff = Math.abs(window.height - dimensionsRef.current.height);
        
        // Check if layout flags will change
        const currentLayout = dimensionsRef.current.width >= DESKTOP_BREAKPOINT;
        const newLayout = window.width >= DESKTOP_BREAKPOINT;
        // const currentDropdown = dimensionsRef.current.width < MOBILE_DROPDOWN_BREAKPOINT;
        // const newDropdown = window.width < MOBILE_DROPDOWN_BREAKPOINT;
        
        const layoutWillChange = currentLayout !== newLayout; // Removed dropdown check
        
        // Only update if layout flags will change (real responsive breakpoints)
        if (layoutWillChange) {
          dimensionsRef.current = { width: window.width, height: window.height };
          setDimensions({ width: window.width, height: window.height });
        }
      }, 100); // Quick response for real layout changes
    });

    return () => {
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, []); // Empty dependency array for stability

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: ResponsiveContextType = useMemo(() => ({
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    isSidebarLayout: dimensions.width >= DESKTOP_BREAKPOINT,
    showMobileDropdown: dimensions.width < DESKTOP_BREAKPOINT, // Changed to DESKTOP_BREAKPOINT
  }), [dimensions.width, dimensions.height]);

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
}; 