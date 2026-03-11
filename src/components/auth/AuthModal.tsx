'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { loginUser, signupUser, forgotPassword } from '@/lib/api';
import { Loader2, Lock, X, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type AuthView = 'login' | 'signup' | 'forgot';

export function AuthModal() {
    const { showAuthModal, setShowAuthModal, login } = useAuthStore();
    const [view, setView] = useState<AuthView>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    if (!showAuthModal) return null;

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await signupUser(name, email, password);
            login(data.user, data.token);
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
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

    /* Shared Google button + OR divider (rendered at bottom for login/signup) */
    const GoogleSection = () => (
        <>
            {/* OR Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-950 px-3 text-zinc-500 uppercase tracking-widest font-medium">or</span>
                </div>
            </div>

            {/* Google OAuth */}
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-800 hover:border-zinc-600 active:scale-[0.98]">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
            </button>
        </>
    );

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
                                    : view === 'signup'
                                        ? 'Create an account to securely manage your health.'
                                        : 'Log in or sign up to securely manage your health.'}
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
                                    Don&apos;t have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => switchView('signup')}
                                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </form>

                            <GoogleSection />
                        </>
                    )}

                    {/* ── SIGNUP VIEW ── */}
                    {view === 'signup' && (
                        <>
                            {error && (
                                <div className="mb-4 p-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-900/50 rounded-xl">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="John Doe"
                                        required
                                        autoComplete="name"
                                    />
                                </div>
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
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <p className="text-[11px] font-medium text-muted-foreground dark:text-zinc-500 ml-1 mt-0.5">Must be at least 6 characters.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                        autoComplete="new-password"
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
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground dark:text-zinc-400 mt-4">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => switchView('login')}
                                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </form>

                            <GoogleSection />
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
