'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardStats, type DashboardStats, type AdminUser } from '@/lib/admin-api';
import { StatsCard } from '@/components/admin/StatsCard';
import {
    Users,
    ShieldCheck,
    MessageSquare,
    MessagesSquare,
    Loader2,
    RefreshCw,
    UserPlus,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadStats = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchDashboardStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-zinc-400">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-red-400 text-sm">{error}</p>
                    <Button onClick={loadStats} variant="ghost" className="text-zinc-400 hover:text-zinc-200">
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-full p-6 md:p-8 space-y-8 animate-admin-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Overview of your platform</p>
                </div>
                <Button
                    onClick={loadStats}
                    variant="ghost"
                    size="icon"
                    className="text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    label="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    gradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                    iconColor="text-blue-400"
                />
                <StatsCard
                    label="Admins"
                    value={stats.adminUsers}
                    icon={ShieldCheck}
                    gradient="bg-gradient-to-br from-primary/20 to-teal-500/20"
                    iconColor="text-primary"
                />
                <StatsCard
                    label="Chat Sessions"
                    value={stats.totalSessions}
                    icon={MessagesSquare}
                    gradient="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
                    iconColor="text-violet-400"
                />
                <StatsCard
                    label="Total Messages"
                    value={stats.totalMessages}
                    icon={MessageSquare}
                    gradient="bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                    iconColor="text-amber-400"
                />
            </div>

            {/* Quick Actions + Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="admin-glass-card rounded-2xl border border-white/[0.07] p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Quick Actions</h2>
                    <div className="space-y-2">
                        <Link href="/admin/users" className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors" />
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Manage Users</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                        <Link href="/admin/users?action=create" className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                            <div className="flex items-center gap-3">
                                <UserPlus className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors" />
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Add New User</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="lg:col-span-2 admin-glass-card rounded-2xl border border-white/[0.07] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Recent Users</h2>
                        <Link href="/admin/users" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                            View All →
                        </Link>
                    </div>

                    {stats.recentUsers.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-4 text-center">No users yet.</p>
                    ) : (
                        <div className="space-y-1">
                            {stats.recentUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between rounded-xl px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                                            user.role === 'admin'
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                                        )}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                                            <p className="text-[11px] text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                                            user.role === 'admin'
                                                ? 'text-primary bg-primary/10'
                                                : 'text-zinc-500 bg-zinc-800/50'
                                        )}>
                                            {user.role}
                                        </span>
                                        <span className="text-xs text-zinc-600">{formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
