'use client';

import { useEffect, useState } from 'react';
import { fetchBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast, type Broadcast } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Megaphone, Trash2, Send, Power, PowerOff } from 'lucide-react';

export default function AdminBroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadRecords = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchBroadcasts();
            setBroadcasts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load broadcasts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await createBroadcast(newMessage);
            setNewMessage('');
            await loadRecords();
        } catch (err: any) {
            setError(err.message || 'Failed to create broadcast');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await updateBroadcast(id, !currentStatus);
            await loadRecords();
        } catch (err: any) {
            setError(err.message || 'Failed to update broadcast status');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this broadcast?");
        if (!confirmed) return;
        try {
            await deleteBroadcast(id);
            await loadRecords();
        } catch (err: any) {
            setError(err.message || 'Failed to delete broadcast');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-full p-6 md:p-8 space-y-6 animate-admin-fade-in">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 border border-primary/20">
                    <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Broadcasts</h1>
                    <p className="text-sm text-zinc-500">Send announcements to all users</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-950/50 border border-red-900/50 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}

            {/* Create New */}
            <form onSubmit={handleCreate} className="admin-glass-card rounded-2xl border border-white/[0.07] p-5 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-sm font-medium text-zinc-300 ml-1">New Broadcast Message</label>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="e.g. Scheduled maintenance at 2 AM UTC..."
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-primary/50 focus-visible:ring-primary/30 h-11"
                    />
                </div>
                <Button 
                    type="submit" 
                    disabled={isSubmitting || !newMessage.trim()}
                    className="h-11 w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98]"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Broadcast
                </Button>
            </form>

            {/* List */}
            <div className="admin-glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
                {broadcasts.length === 0 ? (
                    <div className="px-5 py-12 text-center text-zinc-500 text-sm">
                        No broadcasts found.
                    </div>
                ) : (
                    <ul className="divide-y divide-white/[0.04]">
                        {broadcasts.map((b) => (
                            <li key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-white/[0.02] transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${b.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                                            {b.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(b.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${b.is_active ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>
                                        {b.message}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleToggle(b.id, b.is_active)}
                                        className={`h-8 border-zinc-700/50 hover:bg-white/[0.04] text-xs ${b.is_active ? 'text-zinc-400' : 'text-primary'}`}
                                    >
                                        {b.is_active ? (
                                            <><PowerOff className="mr-1.5 h-3.5 w-3.5" /> Deactivate</>
                                        ) : (
                                            <><Power className="mr-1.5 h-3.5 w-3.5" /> Activate</>
                                        )}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleDelete(b.id)}
                                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
