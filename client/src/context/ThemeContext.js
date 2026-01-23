'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// THEME CONTEXT - Light/Neutral/Dark Mode Management
// ============================================================================

const ThemeContext = createContext(null);

// Theme modes
const THEMES = {
    light: 'light',
    neutral: 'neutral',
    dark: 'dark'
};

export function ThemeProvider({ children }) {
    // Default to dark mode
    const [theme, setThemeState] = useState('dark');
    const [isInitialized, setIsInitialized] = useState(false);

    // Load theme from localStorage on initial mount AND apply class immediately
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('ecopoints_theme');
            // Default to dark if no preference stored
            const initialTheme = storedTheme && ['light', 'neutral', 'dark'].includes(storedTheme)
                ? storedTheme
                : 'dark';
            setThemeState(initialTheme);
            applyThemeClass(initialTheme);
            setIsInitialized(true);
        }
    }, []);

    // Apply theme class to HTML element
    const applyThemeClass = (newTheme) => {
        if (typeof window !== 'undefined') {
            const html = document.documentElement;
            // Remove all theme classes
            html.classList.remove('light', 'neutral', 'dark');
            // Add the current theme class
            html.classList.add(newTheme);
        }
    };

    // Save theme to localStorage and apply class when changed
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            localStorage.setItem('ecopoints_theme', theme);
            applyThemeClass(theme);
        }
    }, [theme, isInitialized]);

    // Set specific theme
    const setTheme = (newTheme) => {
        if (['light', 'neutral', 'dark'].includes(newTheme)) {
            setThemeState(newTheme);
        }
    };

    // Cycle through themes: light -> neutral -> dark -> light
    const cycleTheme = () => {
        setThemeState(prev => {
            switch (prev) {
                case 'light': return 'neutral';
                case 'neutral': return 'dark';
                case 'dark': return 'light';
                default: return 'dark';
            }
        });
    };

    // Toggle between light and dark (backwards compatibility)
    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Computed properties for backwards compatibility
    const isDarkMode = theme === 'dark';
    const isNeutralMode = theme === 'neutral';
    const isLightMode = theme === 'light';

    const value = {
        theme,
        setTheme,
        cycleTheme,
        toggleTheme,
        isDarkMode,
        isNeutralMode,
        isLightMode,
        THEMES
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
