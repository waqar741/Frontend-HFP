'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchUsers, createUser, updateUser, deleteUser, type AdminUser } from '@/lib/admin-api';
import { useAuthStore } from '@/store/authStore';
import { UserTable } from '@/components/admin/UserTable';
import { UserFormDialog, DeleteUserDialog, ResetPasswordDialog } from '@/components/admin/UserFormDialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, UserPlus } from 'lucide-react';

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const searchParams = useSearchParams();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const loadUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchUsers(page, limit, search);
            setUsers(data.users);
            setTotal(data.total);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    // Auto-open create dialog if ?action=create
    useEffect(() => {
        if (searchParams.get('action') === 'create' && !isLoading) {
            setCreateOpen(true);
        }
    }, [searchParams, isLoading]);

    const handleCreate = async (data: { name: string; email: string; password: string; role: string }) => {
        await createUser(data);
        await loadUsers();
    };

    const handleEdit = async (data: { name: string; email: string; password: string; role: string }) => {
        if (!editUser) return;
        await updateUser({
            id: editUser.id,
            name: data.name,
            email: data.email,
            password: data.password || undefined,
            role: data.role,
        });
        await loadUsers();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteUser(deleteTarget.id);
        await loadUsers();
    };

    const handleResetPassword = async (newPassword: string) => {
        if (!resetTarget) return;
        await updateUser({
            id: resetTarget.id,
            password: newPassword,
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-zinc-400">Loading users…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-red-400 text-sm">{error}</p>
                    <Button onClick={loadUsers} variant="ghost" className="text-zinc-400 hover:text-zinc-200">
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full p-6 md:p-8 space-y-6 animate-admin-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-sm text-zinc-500 mt-1">{total} total users on the platform</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={loadUsers}
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                        title="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* User Table */}
            <UserTable
                users={users}
                total={total}
                page={page}
                searchQuery={search}
                onSearchChange={(q) => { setSearch(q); setPage(1); }}
                onPageChange={setPage}
                onEdit={(user) => setEditUser(user)}
                onDelete={(user) => setDeleteTarget(user)}
                onResetPassword={(user) => setResetTarget(user)}
                currentUserId={currentUser?.id}
            />

            {/* Create User Dialog */}
            <UserFormDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
            />

            {/* Edit User Dialog */}
            <UserFormDialog
                open={!!editUser}
                onClose={() => setEditUser(null)}
                onSubmit={handleEdit}
                editUser={editUser}
            />

            {/* Delete User Dialog */}
            <DeleteUserDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                userName={deleteTarget?.name || ''}
            />

            {/* Reset Password Dialog */}
            <ResetPasswordDialog
                open={!!resetTarget}
                onClose={() => setResetTarget(null)}
                onSubmit={handleResetPassword}
                userName={resetTarget?.name || ''}
            />
        </div>
    );
}
