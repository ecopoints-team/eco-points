'use client';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';

import AdminLayoutComponent from '../../src/Components/AdminLayout';

export default function AdminLayout({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AdminLayoutComponent>
                    {children}
                </AdminLayoutComponent>
            </AuthProvider>
        </ThemeProvider>
    );
}
