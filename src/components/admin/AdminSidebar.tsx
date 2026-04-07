'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    LayoutDashboard,
    Users,
    ArrowLeft,
    ShieldCheck,
    LogOut,
    Megaphone,
    Settings,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
    { href: '/admin/broadcasts', label: 'Broadcasts', icon: Megaphone },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <div className="flex h-full flex-col p-4">
            {/* Brand */}
            <div className="flex items-center gap-3 px-3 mb-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white tracking-wide">Admin Panel</p>
                    <p className="text-[11px] text-zinc-500">HealthFirstPriority</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5 border border-primary/10'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                            )}
                        >
                            <item.icon className={cn('h-4.5 w-4.5', isActive ? 'text-primary' : 'text-zinc-500')} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Chat
                </Link>

                {user && (
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-xs text-zinc-400 truncate">{user.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logout()}
                            className="h-7 w-7 text-zinc-500 hover:text-red-400"
                            title="Logout"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
