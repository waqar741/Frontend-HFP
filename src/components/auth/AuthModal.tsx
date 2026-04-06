'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { loginUser, forgotPassword } from '@/lib/api';
import { Loader2, Lock, X, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type AuthView = 'login' | 'forgot';

export function AuthModal() {
    const { showAuthModal, setShowAuthModal, login } = useAuthStore();
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    if (!showAuthModal) return null;

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setError('');
        setForgotSuccess(false);
    };

    const switchView = (v: AuthView) => {
        resetForm();
        setView(v);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await loginUser(email, password);
            login(data.user, data.token);
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };



    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setForgotSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Request failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setShowAuthModal(false);
        }
    };



    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            {/* Mobile: bottom sheet | Desktop: centered card */}
            <div className="relative w-full md:max-w-[440px] max-h-[92vh] overflow-y-auto scrollbar-hide rounded-t-3xl md:rounded-3xl bg-background dark:bg-zinc-950 border border-border dark:border-zinc-800/60 shadow-2xl shadow-black/40 animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-4">
                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 md:hidden">
                    <div className="w-10 h-1 rounded-full bg-border dark:bg-zinc-700" />
                </div>

                {/* Close button */}
                <button
                    onClick={() => setShowAuthModal(false)}
                    className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 sm:p-8 pt-4 md:pt-8">
                    {/* Logo & Header */}
                    <div className="flex flex-col items-center space-y-3 mb-8">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 shadow-lg transform transition-transform hover:scale-105 p-2">
                            <Image
                                src="/favicon/favicon.svg"
                                alt="HealthFirstPriority Logo"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain drop-shadow-md"
                                priority
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
                                {view === 'forgot' ? 'Reset Password' : 'Welcome to HealthFirstPriority'}
                            </h2>
                            <p className="text-sm text-muted-foreground dark:text-zinc-400">
                                {view === 'forgot'
                                    ? "Enter your email and we'll send you a reset link."
                                    : 'Log in to securely manage your health.'}
                            </p>
                        </div>
                    </div>

                    {/* ── FORGOT PASSWORD VIEW ── */}
                    {view === 'forgot' && (
                        <>
                            {forgotSuccess ? (
                                <div className="flex flex-col items-center text-center space-y-4 py-4">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle className="h-7 w-7 text-emerald-400 dark:text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-foreground/80 dark:text-zinc-300">
                                        If an account with that email exists, a password reset link has been sent. Please check your inbox.
                                    </p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => switchView('login')}
                                        className="text-primary hover:text-primary/80 text-sm"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    {error && (
                                        <div className="p-3 text-sm font-medium text-red-600 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            placeholder="name@example.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-sm font-bold text-white transition-all hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => switchView('login')}
                                        className="w-full text-center text-sm text-muted-foreground dark:text-zinc-400 hover:text-primary transition-colors mt-2"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5 inline mr-1" /> Back to Login
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {/* ── LOGIN VIEW ── */}
                    {view === 'login' && (
                        <>
                            {error && (
                                <div className="mb-4 p-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-900/50 rounded-xl">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="name@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => switchView('forgot')}
                                            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-sm font-bold text-white transition-all hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 mt-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        'Continue'
                                    )}
                                </Button>

                                <div className="text-center text-sm text-zinc-400 mt-4">
                                    Contact your administrator if you do not have an account.
                                </div>
                            </form>
                        </>
                    )}



                    {/* Trust Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground dark:text-zinc-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>End-to-End Encrypted & Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
