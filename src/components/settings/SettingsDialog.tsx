import { useState, useEffect } from 'react';
import { Settings, Download, FileText, Sun, Moon, Monitor, FileCode, Database, Sliders, DatabaseBackup, AlertTriangle, CheckCircle, User, Type, MousePointer, ChevronsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore, PERSONAS } from '@/hooks/useChatStore';
import { exportAllChatsToText, exportAllChatsToPDF, exportAllChatsToMarkdown, exportAllChatsToCSV, exportAllChatsToJSON } from '@/lib/export-utils';
import { useTheme } from 'next-themes';

type TabId = 'general' | 'personas' | 'data';
type ToastInfo = { message: string; type: 'success' | 'error' } | null;

export function SettingsDialog() {
    const { sessions, fontSize, setFontSize, enterToSend, setEnterToSend, autoScroll, setAutoScroll, customPersona, setCustomPersona, activePersonaId, setActivePersona } = useChatStore();
    const { theme, setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [isAnonymized, setIsAnonymized] = useState(false);
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

    // Custom confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toast, setToast] = useState<ToastInfo>(null);

    // Custom persona form state
    const [personaName, setPersonaName] = useState(customPersona?.name || '');
    const [personaPrompt, setPersonaPrompt] = useState(customPersona?.systemPrompt || '');

    useEffect(() => {
        setSelectedSessionIds(sessions.map(s => s.id));
    }, [sessions]);

    useEffect(() => {
        setPersonaName(customPersona?.name || '');
        setPersonaPrompt(customPersona?.systemPrompt || '');
    }, [customPersona]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getSelectedSessions = () => sessions.filter(s => selectedSessionIds.includes(s.id));
    const handleToggleSession = (id: string, checked: boolean) => {
        if (checked) setSelectedSessionIds(prev => [...prev, id]);
        else setSelectedSessionIds(prev => prev.filter(sId => sId !== id));
    };

    const handleExportTxt = () => { const s = getSelectedSessions(); if (s.length > 0) exportAllChatsToText(s, isAnonymized); };
    const handleExportPdf = () => { const s = getSelectedSessions(); if (s.length > 0) exportAllChatsToPDF(s, isAnonymized); };
    const handleExportMd = () => { const s = getSelectedSessions(); if (s.length > 0) exportAllChatsToMarkdown(s, isAnonymized); };
    const handleExportCsv = () => { const s = getSelectedSessions(); if (s.length > 0) exportAllChatsToCSV(s, isAnonymized); };
    const handleExportJson = () => { const s = getSelectedSessions(); if (s.length > 0) exportAllChatsToJSON(s, isAnonymized); };

    const handleConfirmClear = () => {
        useChatStore.getState().clearAllSessions();
        setConfirmOpen(false);
        showToast('All chats cleared successfully.');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target?.result as string);
                if (Array.isArray(jsonData) && jsonData.every(s => s.id && s.messages)) {
                    useChatStore.getState().importSessions(jsonData);
                    showToast(`Imported ${jsonData.length} session(s) successfully.`, 'success');
                } else {
                    showToast('Invalid JSON format. Please check the file.', 'error');
                }
            } catch {
                showToast('Failed to parse JSON file.', 'error');
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleSaveCustomPersona = () => {
        if (!personaName.trim() || !personaPrompt.trim()) {
            showToast('Please fill in both Name and System Prompt.', 'error');
            return;
        }
        setCustomPersona({ name: personaName.trim(), systemPrompt: personaPrompt.trim() });
        setActivePersona('custom');
        showToast(`Custom persona "${personaName.trim()}" saved and activated!`);
    };

    const handleClearCustomPersona = () => {
        setCustomPersona(null);
        setPersonaName('');
        setPersonaPrompt('');
        if (activePersonaId === 'custom') setActivePersona('general');
        showToast('Custom persona removed.');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Sliders },
        { id: 'personas', label: 'Personas', icon: User },
        { id: 'data', label: 'Data Management', icon: DatabaseBackup },
    ] as const;

    return (
        <>
            {/* Custom Confirm Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete All Chats?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            This will permanently delete <strong>all</strong> chat sessions and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmClear}>Yes, Delete Everything</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-full shadow-xl text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'
                    }`}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {toast.message}
                </div>
            )}

            {/* Main Settings Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover border-border text-popover-foreground w-[95vw] sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[680px]">

                    {/* Sidebar */}
                    <div className="shrink-0 w-full md:w-56 bg-secondary/30 border-b md:border-b-0 md:border-r border-border flex flex-col">
                        <div className="p-5 pb-3">
                            <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-1 hidden md:block">
                                Manage your workspace.
                            </DialogDescription>
                        </div>
                        <nav className="px-3 pb-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0 bg-background">
                        <div className="p-5 pb-4 border-b border-border shrink-0">
                            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                {(() => {
                                    const Icon = tabs.find(t => t.id === activeTab)?.icon as React.ElementType;
                                    return <Icon className="h-4 w-4 text-muted-foreground" />;
                                })()}
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                        </div>

                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-5 space-y-6 pb-8">

                                {/* ── GENERAL ─────────────────────────────── */}
                                {activeTab === 'general' && (
                                    <div className="space-y-6">

                                        {/* Theme */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="text-sm font-semibold text-foreground">Theme</h3>
                                            </div>
                                            <Select value={theme} onValueChange={setTheme}>
                                                <SelectTrigger className="w-full max-w-xs bg-background border-border">
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" /> System Default</div></SelectItem>
                                                    <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div></SelectItem>
                                                    <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Font Size */}
                                        <div className="space-y-2 pt-3 border-t border-border">
                                            <div className="flex items-center gap-2">
                                                <Type className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Adjust text size for readability, especially for medical terminology.</p>
                                            <div className="flex gap-2 mt-2">
                                                {(['sm', 'md', 'lg'] as const).map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setFontSize(size)}
                                                        className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${fontSize === size
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border text-muted-foreground hover:bg-secondary'
                                                            }`}
                                                    >
                                                        {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className={`text-muted-foreground mt-1 ${fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
                                                Preview text in {fontSize === 'sm' ? 'Small' : fontSize === 'md' ? 'Medium' : 'Large'} size.
                                            </p>
                                        </div>

                                        {/* Enter to Send */}
                                        <div className="space-y-2 pt-3 border-t border-border">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Enter to Send</h3>
                                                </div>
                                                <Switch
                                                    id="enter-to-send"
                                                    checked={enterToSend}
                                                    onCheckedChange={setEnterToSend}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {enterToSend
                                                    ? 'Enter sends the message. Use Shift + Enter for a new line.'
                                                    : 'Enter adds a new line. Use Shift + Enter to send.'}
                                            </p>
                                        </div>

                                        {/* Auto Scroll */}
                                        <div className="space-y-2 pt-3 border-t border-border">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ChevronsDown className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Auto-Scroll</h3>
                                                </div>
                                                <Switch
                                                    id="auto-scroll"
                                                    checked={autoScroll}
                                                    onCheckedChange={setAutoScroll}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {autoScroll
                                                    ? 'Chat auto-scrolls to the latest response as it generates.'
                                                    : 'Auto-scroll is off. Scroll up freely while AI responds. A button will appear to jump back.'}
                                            </p>
                                        </div>

                                    </div>
                                )}

                                {/* ── PERSONAS ────────────────────────────── */}
                                {activeTab === 'personas' && (
                                    <div className="space-y-5">
                                        {/* Built-in Personas */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground mb-2">Built-in Personas</h3>
                                            <div className="space-y-2">
                                                {PERSONAS.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setActivePersona(p.id)}
                                                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${activePersonaId === p.id && activePersonaId !== 'custom'
                                                                ? 'border-primary bg-primary/10 text-foreground'
                                                                : 'border-border hover:bg-secondary/40 text-muted-foreground'
                                                            }`}
                                                    >
                                                        <div className="font-medium text-sm">{p.name}</div>
                                                        <div className="text-xs opacity-70 mt-0.5">{p.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Persona */}
                                        <div className="pt-4 border-t border-border space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground">Custom Persona</h3>
                                                {customPersona && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activePersonaId === 'custom' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        {activePersonaId === 'custom' ? 'Active' : 'Saved'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Create your own AI persona with a custom system prompt to bypass the built-in doctors.
                                            </p>
                                            <input
                                                type="text"
                                                placeholder="Persona name (e.g. My Custom Doctor)"
                                                value={personaName}
                                                onChange={e => setPersonaName(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <textarea
                                                placeholder="Write your custom system prompt here... (e.g. You are a cardiologist specializing in...)"
                                                value={personaPrompt}
                                                onChange={e => setPersonaPrompt(e.target.value)}
                                                rows={5}
                                                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveCustomPersona} className="flex-1">
                                                    Save & Activate
                                                </Button>
                                                {customPersona && (
                                                    <Button variant="outline" onClick={handleClearCustomPersona}>
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── DATA ────────────────────────────────── */}
                                {activeTab === 'data' && (
                                    <div className="space-y-6">

                                        {/* Export */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">Export Sessions</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Download your chat history.</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Switch id="anonymize-mode" checked={isAnonymized} onCheckedChange={setIsAnonymized} className="scale-90" />
                                                    <label htmlFor="anonymize-mode" className="text-xs cursor-pointer text-muted-foreground select-none">Anonymize</label>
                                                </div>
                                            </div>

                                            <div className="border border-border rounded-lg p-3 bg-secondary/10 space-y-3">
                                                <ScrollArea className="h-[90px] rounded-md border border-border bg-background p-1.5">
                                                    {sessions.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground p-3 text-center">No sessions yet.</p>
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            {sessions.map(session => (
                                                                <div key={session.id} className="flex items-center gap-2 px-1.5 py-1 hover:bg-secondary/40 rounded transition-colors">
                                                                    <Checkbox
                                                                        id={`export-${session.id}`}
                                                                        checked={selectedSessionIds.includes(session.id)}
                                                                        onCheckedChange={(checked) => handleToggleSession(session.id, checked as boolean)}
                                                                    />
                                                                    <label htmlFor={`export-${session.id}`} className="text-sm flex-1 truncate cursor-pointer select-none">
                                                                        {session.title || 'Untitled Session'}
                                                                    </label>
                                                                    <span className="text-xs text-muted-foreground shrink-0">
                                                                        {new Date(session.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                    {[
                                                        { label: 'TXT', icon: FileText, fn: handleExportTxt },
                                                        { label: 'PDF', icon: Download, fn: handleExportPdf },
                                                        { label: 'MD', icon: FileCode, fn: handleExportMd },
                                                        { label: 'CSV', icon: Database, fn: handleExportCsv },
                                                        { label: 'JSON', icon: FileCode, fn: handleExportJson },
                                                    ].map(({ label, icon: Icon, fn }) => (
                                                        <Button key={label} size="sm" variant="outline" onClick={fn} disabled={selectedSessionIds.length === 0}>
                                                            <Icon className="mr-1.5 h-3.5 w-3.5" /> {label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Import */}
                                        <div className="space-y-2 pt-2 border-t border-border">
                                            <h3 className="text-sm font-semibold text-foreground">Import Chat History</h3>
                                            <p className="text-xs text-muted-foreground">Restore a previously exported JSON backup.</p>
                                            <div>
                                                <input type="file" id="import-json" accept=".json" className="hidden" onChange={handleImport} />
                                                <label htmlFor="import-json">
                                                    <Button asChild variant="outline" className="cursor-pointer">
                                                        <span><Download className="mr-2 h-4 w-4 rotate-180" /> Import JSON Backup</span>
                                                    </Button>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete all chat history. This cannot be undone.</p>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
                                                Clear All Chats
                                            </Button>
                                        </div>

                                    </div>
                                )}

                            </div>
                        </ScrollArea>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
}
