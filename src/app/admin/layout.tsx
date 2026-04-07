'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { loginUser } from '@/lib/api';
import { HARDCODED_ADMIN_MODE, HARDCODED_CREDENTIALS } from '@/lib/admin-api';
import { Loader2, ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, token, isAuthenticated, isAuthLoading, login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // If still loading auth state, show loader
    if (isAuthLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[hsl(222.2,47.4%,11.2%)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-zinc-400">Checking credentials…</p>
                </div>
            </div>
        );
    }

    // If not authenticated or not admin → show admin login form
    if (!isAuthenticated || !user || user.role !== 'admin') {
        const handleAdminLogin = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setIsLoggingIn(true);
            try {
                if (HARDCODED_ADMIN_MODE && email === HARDCODED_CREDENTIALS.email && password === HARDCODED_CREDENTIALS.password) {
                    login({ id: 'hardcoded-admin', name: 'Admin', email: 'admin@healthfirstpriority.com', role: 'admin', auth_type: 'email', created_at: new Date().toISOString() } as any, 'hardcoded-token');
                    setIsLoggingIn(false);
                    return;
                }
                const data = await loginUser(email, password);
                if (data.user.role !== 'admin') {
                    setError('Access denied. Admin privileges required.');
                    setIsLoggingIn(false);
                    return;
                }
                login(data.user, data.token);
            } catch (err: any) {
                setError(err.message || 'Login failed');
            } finally {
                setIsLoggingIn(false);
            }
        };

        return (
            <div className="flex min-h-screen items-center justify-center bg-[hsl(222.2,47.4%,11.2%)] p-4">
                <div className="w-full max-w-md">
                    {/* Admin Login Card */}
                    <div className="admin-glass-card rounded-2xl border border-white/[0.07] p-8 shadow-2xl shadow-black/40">
                        {/* Header */}
                        <div className="mb-8 flex flex-col items-center space-y-4">
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/20 shadow-lg shadow-primary/10">
                                <ShieldAlert className="h-8 w-8 text-primary" />
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary animate-pulse" />
                            </div>
                            <div className="text-center space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight text-white">Admin Access</h1>
                                <p className="text-sm text-zinc-400">Authenticate to access the admin panel</p>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 rounded-xl bg-red-950/50 border border-red-900/50 p-3 text-sm font-medium text-red-200">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-12 w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-600 focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    placeholder="admin@healthfirstpriority.com"
                                    required
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-600 focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-sm font-bold text-white transition-all hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 mt-2"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Authenticating…
                                    </>
                                ) : (
                                    'Access Admin Panel'
                                )}
                            </Button>
                        </form>

                        {/* Trust Badge */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Restricted Access · Authenticated Admins Only</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Admin is authenticated → show admin panel
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[hsl(222.2,47.4%,11.2%)]">
            {/* Admin Sidebar */}
            <aside className="hidden md:flex md:flex-col w-[260px] border-r border-white/[0.06] bg-[hsl(224,40%,14%)]">
                <AdminSidebar />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
