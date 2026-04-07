'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Settings } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadSettings = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchSettings();
            setSettings(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        setError('');
        try {
            await updateSettings(settings);
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Default keys to ensure there's something to edit if DB is empty
    const displayKeys = ['site_name', 'model_temperature', 'max_tokens_per_chat'];
    const currentKeys = Array.from(new Set([...displayKeys, ...Object.keys(settings)]));

    return (
        <div className="min-h-full p-6 md:p-8 space-y-6 animate-admin-fade-in">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 border border-primary/20">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
                    <p className="text-sm text-zinc-500">Configure global platform variables</p>
                </div>
            </div>

            {error && (
                <div className="max-w-2xl rounded-xl bg-red-950/50 border border-red-900/50 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}
            
            {message && (
                <div className="max-w-2xl rounded-xl bg-green-950/50 border border-green-900/50 p-4 text-sm text-green-200">
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} className="max-w-2xl admin-glass-card rounded-2xl border border-white/[0.07] p-6 space-y-6">
                {currentKeys.map((key) => (
                    <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <Input
                            value={settings[key] || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            placeholder={`Enter ${key}...`}
                            className="bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus:border-primary/50 focus-visible:ring-primary/30"
                        />
                    </div>
                ))}

                <div className="pt-4 border-t border-white/[0.06]">
                    <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98]"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
