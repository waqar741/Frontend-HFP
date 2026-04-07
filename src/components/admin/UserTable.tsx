'use client';

import { useState } from 'react';
import { AdminUser } from '@/lib/admin-api';
import { Search, MoreHorizontal, Pencil, Trash2, Key, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface UserTableProps {
    users: AdminUser[];
    total: number;
    page: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onPageChange: (page: number) => void;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    onResetPassword: (user: AdminUser) => void;
    currentUserId?: string;
}

export function UserTable({ users, total, page, searchQuery, onSearchChange, onPageChange, onEdit, onDelete, onResetPassword, currentUserId }: UserTableProps) {


    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Search users by name, email, or role…"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-10 bg-zinc-900/50 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-500 rounded-xl focus:border-primary/50 focus-visible:ring-primary/30"
                />
            </div>

            {/* Table */}
            <div className="admin-glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">User</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Role</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Joined</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                                        {searchQuery ? 'No users match your search.' : 'No users found.'}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="group transition-colors hover:bg-white/[0.02]"
                                    >
                                        {/* User */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                                                    user.role === 'admin'
                                                        ? 'bg-gradient-to-br from-primary/20 to-blue-600/20 text-primary border border-primary/20'
                                                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                                                )}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-200">{user.name}</p>
                                                    {user.id === currentUserId && (
                                                        <span className="text-[10px] text-primary font-medium">(You)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-5 py-3.5 text-zinc-400">{user.email}</td>

                                        {/* Role Badge */}
                                        <td className="px-5 py-3.5">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                                user.role === 'admin'
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/30'
                                            )}>
                                                {user.role === 'admin' ? (
                                                    <ShieldCheck className="h-3 w-3" />
                                                ) : (
                                                    <UserIcon className="h-3 w-3" />
                                                )}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>

                                        {/* Joined */}
                                        <td className="px-5 py-3.5 text-zinc-500">{formatDate(user.created_at)}</td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700/50 text-zinc-200 min-w-[160px]">
                                                    <DropdownMenuItem onClick={() => onEdit(user)} className="gap-2 focus:bg-white/[0.06]">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onResetPassword(user)} className="gap-2 focus:bg-white/[0.06]">
                                                        <Key className="h-3.5 w-3.5" />
                                                        Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-700/30" />
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(user)}
                                                        className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-950/30"
                                                        disabled={user.id === currentUserId}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-1">
                <p className="text-xs text-zinc-500">
                    Showing {users.length} of {total} users
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-zinc-500 font-medium">Page {page}</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={users.length < 50} // Rough bound if limit is 50
                        onClick={() => onPageChange(page + 1)}
                        className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
