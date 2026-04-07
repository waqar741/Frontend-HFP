'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    gradient: string;
    iconColor: string;
}

export function StatsCard({ label, value, icon: Icon, gradient, iconColor }: StatsCardProps) {
    return (
        <div className="admin-glass-card group relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
            {/* Gradient glow behind icon */}
            <div className={cn('absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30', gradient)} />

            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
                    <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
                </div>
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06]', gradient)}>
                    <Icon className={cn('h-5 w-5', iconColor)} />
                </div>
            </div>
        </div>
    );
}
