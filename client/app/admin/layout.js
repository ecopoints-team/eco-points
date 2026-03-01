'use client';
import AdminLayoutComponent from '../../src/Components/AdminLayout';

export default function AdminLayout({ children }) {
    return (
        <AdminLayoutComponent>
            {children}
        </AdminLayoutComponent>
    );
}
