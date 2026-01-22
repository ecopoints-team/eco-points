'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// THEME CONTEXT - Dark/Light Mode Management
// ============================================================================

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    // Default to dark mode
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load theme from localStorage on initial mount AND apply class immediately
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('ecopoints_theme');
            // Default to dark if no preference stored
            const shouldBeDark = storedTheme ? storedTheme === 'dark' : true;
            setIsDarkMode(shouldBeDark);

            // Apply class immediately on load
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            setIsInitialized(true);
        }
    }, []);

    // Save theme to localStorage and apply class to HTML element when changed
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            localStorage.setItem('ecopoints_theme', isDarkMode ? 'dark' : 'light');

            // Apply or remove 'dark' class on the HTML element for Tailwind
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isDarkMode, isInitialized]);

    // Toggle theme
    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    // Set specific theme
    const setTheme = (theme) => {
        setIsDarkMode(theme === 'dark');
    };

    const value = {
        isDarkMode,
        toggleTheme,
        setTheme,
        theme: isDarkMode ? 'dark' : 'light',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Custom hook to use theme context
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
