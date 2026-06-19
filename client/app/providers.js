'use client';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { UIProvider, useUI } from '../src/context/UIContext';
import RouteLoadingBar from '../src/components/shared/RouteLoadingBar';

// Lazy-load the login modal — it's only rendered when open
const LogIn = dynamic(() => import('../src/components/pages/LogIn'), { ssr: false });

// Inner component so useUI() can be called inside UIProvider
function GlobalModals() {
    const { isLoginOpen, loginInitialSignUp, closeLoginModal } = useUI();

    if (!isLoginOpen) return null;

    return (
        <LogIn
            onClose={closeLoginModal}
            initialSignUp={loginInitialSignUp}
        />
    );
}

export function Providers({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <UIProvider>
                    <RouteLoadingBar />
                    {children}
                    <GlobalModals />
                </UIProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
