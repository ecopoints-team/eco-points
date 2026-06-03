'use client';
import AdminLayoutComponent from '../../src/components/admin/AdminLayout';
import { DashboardCacheProvider } from '../../src/context/DashboardCacheContext';

export default function AdminLayout({ children }) {
    return (
        <AdminLayoutComponent>
            <DashboardCacheProvider>
                {children}
            </DashboardCacheProvider>
        </AdminLayoutComponent>
    );
}
