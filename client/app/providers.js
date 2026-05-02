'use client';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import RouteLoadingBar from '../src/components/shared/RouteLoadingBar';

export function Providers({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <RouteLoadingBar />
                {children}
            </AuthProvider>
        </ThemeProvider>
    );
}
