'use client';

import { useState, useEffect } from 'react';
import { signupUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Auth state hook
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);

        try {
            const data = await signupUser(name, email, password);
            login(data.user, data.token);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background dark:bg-zinc-950 font-sans selection:bg-primary/30 py-12">
            {/* Dynamic Abstract Background (Reversed Colors for uniqueness from Login) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-pulse duration-10000" />
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/10 blur-[150px] mix-blend-screen animate-pulse duration-7000" />
                <div className="absolute bottom-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/10 blur-[100px] mix-blend-screen" />
                {/* Subtle digital grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Central Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-[480px] px-6 md:px-0">
                <div className="backdrop-blur-xl bg-background dark:bg-zinc-900/60 border border-border dark:border-zinc-800/50 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] shadow-blue-500/5 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden group">
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex flex-col items-center justify-center space-y-4 mb-8 relative z-10">
                        <div className="flex items-center justify-center w-16 h-16 transform transition-transform hover:scale-105 hover:-rotate-3">
                            <Image
                                src="/favicon/favicon.svg"
                                alt="HealthFirstPriority Logo"
                                width={64}
                                height={64}
                                className="w-full h-full object-contain drop-shadow-lg rounded-2xl dark:invert-0"
                                priority
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground dark:text-white">Create Account</h1>
                            <p className="text-sm font-medium text-muted-foreground dark:text-zinc-400">
                                Join us and take control of your health journey.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm font-medium text-red-600 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center relative z-10">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex h-11 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="John Doe"
                                required
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-11 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-11 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                                minLength={6}
                                required
                                autoComplete="new-password"
                            />
                            <p className="text-[11px] font-medium text-zinc-500 ml-1 mt-1">Must be at least 6 characters.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="flex h-11 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-950/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                                minLength={6}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-3.5 text-sm font-bold text-foreground dark:text-white transition-all hover:from-blue-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Sign Up
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Google OAuth - Positioned at bottom as requested */}
                    <div className="relative my-8 z-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border dark:border-zinc-800/60" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background dark:bg-zinc-950/60 px-3 text-muted-foreground uppercase tracking-widest font-medium">or</span>
                        </div>
                    </div>

                    <button className="relative z-10 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background dark:bg-zinc-900/60 px-4 py-3 text-sm font-medium text-foreground dark:text-zinc-200 transition-all hover:bg-muted/60 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 active:scale-[0.98]">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="mt-8 text-center text-sm font-medium text-muted-foreground dark:text-zinc-400 relative z-10">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
