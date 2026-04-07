'use client';

import { useEffect, useState } from 'react';
import { fetchSystemStats, type SystemStats } from '@/lib/admin-api';
import { StatsCard } from '@/components/admin/StatsCard';
import {
    Activity,
    Server,
    ShieldAlert,
    Wifi,
    WifiOff,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MonitoringPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            const data = await fetchSystemStats();
            setStats(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch system stats:', err);
            setError(err.message || 'Failed to load system stats');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !stats) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-red-500/10 p-3">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-zinc-400">{error}</p>
                <Button onClick={loadStats} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Monitoring</h1>
                    <p className="text-zinc-400 text-sm mt-1">Real-time health and performance metrics</p>
                </div>
                <Button
                    onClick={loadStats}
                    variant="outline"
                    className="gap-2 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] text-white self-start sm:self-auto"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    label="Total Nodes"
                    value={stats.total_nodes}
                    icon={Server}
                    gradient="from-blue-500 to-indigo-500"
                    iconColor="text-blue-200"
                />
                <StatsCard
                    label="Healthy Nodes"
                    value={stats.healthy_nodes}
                    icon={Wifi}
                    gradient="from-emerald-500 to-green-500"
                    iconColor="text-emerald-200"
                />
                <StatsCard
                    label="Degraded Nodes"
                    value={stats.degraded_nodes}
                    icon={ShieldAlert}
                    gradient="from-yellow-500 to-orange-500"
                    iconColor="text-yellow-200"
                />
                <StatsCard
                    label="Down Nodes"
                    value={stats.down_nodes}
                    icon={WifiOff}
                    gradient="from-red-500 to-rose-500"
                    iconColor="text-red-200"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Cluster Status Box */}
                <div className="admin-glass-card rounded-2xl border border-white/[0.07] p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Activity className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Cluster Health</h2>
                            <p className="text-xs text-zinc-400">Aggregated status</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                            <span className="text-sm text-zinc-400">Circuit Breaker</span>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium uppercase",
                                stats.circuit_breaker_state === 'closed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                stats.circuit_breaker_state === 'half-open' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                            )}>
                                {stats.circuit_breaker_state}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                            <span className="text-sm text-zinc-400">Orchestrator Uptime</span>
                            <div className="flex items-center gap-1.5 text-sm text-white">
                                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                {stats.uptime}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Worker Nodes List */}
                <div className="admin-glass-card rounded-2xl border border-white/[0.07] p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Server className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Worker Nodes</h2>
                            <p className="text-xs text-zinc-400">Individual status & latency</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stats.nodes.map((node, i) => (
                            <div 
                                key={i} 
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] transition-colors gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2.5 w-2.5 rounded-full shadow-[0_0_8px]",
                                        node.status === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                        node.status === 'degraded' ? 'bg-yellow-500 shadow-yellow-500/50' :
                                        'bg-red-500 shadow-red-500/50'
                                    )} />
                                    <div>
                                        <p className="text-sm font-medium text-white truncate max-w-[180px]">{node.address}</p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                            Last check: {new Date(node.last_checked).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 sm:max-w-[40%]">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "text-sm font-medium tabular-nums",
                                            node.response_time_ms < 100 ? 'text-emerald-400' :
                                            node.response_time_ms < 500 ? 'text-yellow-400' :
                                            'text-red-400'
                                        )}>
                                            {node.response_time_ms > 0 ? `${node.response_time_ms}ms` : '—'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Latency</span>
                                    </div>
                                    <div className="w-16">
                                        <span className={cn(
                                            "inline-flex w-full justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                            node.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                                            node.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-red-500/10 text-red-400'
                                        )}>
                                            {node.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {stats.nodes.length === 0 && (
                            <div className="py-8 text-center text-sm text-zinc-500">
                                No worker nodes found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
