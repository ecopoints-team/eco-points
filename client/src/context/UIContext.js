'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

// ============================================================================
// UI CONTEXT — Global modal / overlay state
//
// Provides openLoginModal / closeLoginModal so any component in the tree
// (e.g. RequireAuth, NavBar, CTASection) can trigger the login modal without
// prop-drilling or navigating away from the current page.
// ============================================================================

const UIContext = createContext(null);

export function UIProvider({ children }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginInitialSignUp, setLoginInitialSignUp] = useState(false);

    const openLoginModal = useCallback((signUp = false) => {
        setLoginInitialSignUp(signUp);
        setIsLoginOpen(true);
    }, []);

    const closeLoginModal = useCallback(() => {
        setIsLoginOpen(false);
        setLoginInitialSignUp(false);
    }, []);

    const value = {
        isLoginOpen,
        loginInitialSignUp,
        openLoginModal,
        closeLoginModal,
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}

export default UIContext;
