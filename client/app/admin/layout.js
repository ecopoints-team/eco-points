'use client';
import AdminLayoutComponent from '../../src/components/admin/AdminLayout';

export default function AdminLayout({ children }) {
    return (
        <AdminLayoutComponent>
            {children}
        </AdminLayoutComponent>
    );
}
