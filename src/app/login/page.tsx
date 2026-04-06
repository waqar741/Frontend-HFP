'use client';

import { useState, useEffect } from 'react';
import { loginUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@hfp.com');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);

        try {
            const data = await loginUser(email, password);
            login(data.user, data.token);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background dark:bg-zinc-950 font-sans selection:bg-primary/30">
            {/* Dynamic Abstract Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse duration-10000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen animate-pulse duration-7000" />
                <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-purple-600/10 blur-[100px] mix-blend-screen" />
                {/* Subtle digital grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Central Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-[440px] px-6 py-12 md:px-0">
                <div className="backdrop-blur-xl bg-background dark:bg-zinc-900/60 border border-border dark:border-zinc-800/50 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] shadow-primary/5 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden group">
                    {/* Inner subtle glow that follows the form */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex flex-col items-center justify-center space-y-4 mb-10 relative z-10">
                        <div className="flex items-center justify-center w-16 h-16 transform transition-transform hover:scale-105 hover:rotate-3">
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
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground dark:text-white">Welcome Back</h1>
                            <p className="text-sm font-medium text-muted-foreground dark:text-zinc-400">
                                Sign in to your intelligent health companion.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 text-sm font-medium text-red-600 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center relative z-10">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-medium text-foreground/80 dark:text-zinc-300">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 hover:text-primary transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-input dark:border-zinc-700/50 bg-background dark:bg-zinc-900/50 px-4 text-sm text-foreground dark:text-zinc-100 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-inner transition-all hover:border-zinc-400 dark:hover:border-zinc-600 focus:bg-background dark:focus:bg-zinc-900 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group mt-8 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                        <div className="flex justify-center mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('admin@hfp.com');
                                    setPassword('admin123');
                                }}
                                className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10"
                            >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80"></span>
                                </span>
                                Use Demo Account
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-muted-foreground dark:text-zinc-400 relative z-10">
                        Contact your administrator if you do not have an account.
                    </div>
                </div>
            </div>
        </div>
    );
}
