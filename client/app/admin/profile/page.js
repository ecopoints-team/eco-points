"use client";
import AdminProfile from "../../../src/components/admin/AdminProfile";
import RequirePermission from "../../../src/components/admin/RequirePermission";

export default function AdminProfilePage() {
    return (
        <RequirePermission category="dashboard">
            <AdminProfile />
        </RequirePermission>
    );
}
