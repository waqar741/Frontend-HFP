import { useState, useEffect } from 'react';
import { Settings, Download, FileText, Sun, Moon, Monitor, FileCode, Database, Sliders, DatabaseBackup, AlertTriangle, CheckCircle, User, Type, MousePointer, ChevronsDown, Trash2, RotateCcw } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type TabId = 'general' | 'personas' | 'data';
type ToastInfo = { message: string; type: 'success' | 'error' } | null;

export function SettingsDialog() {
    const { sessions, fontSize, setFontSize, enterToSend, setEnterToSend, autoScroll, setAutoScroll, customPersonas, addCustomPersona, deleteCustomPersona, activePersonaId, setActivePersona } = useChatStore();
    const { theme, setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [isAnonymized, setIsAnonymized] = useState(false);
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState<{ id: string, name: string } | null>(null);
    const [exportFormatToConfirm, setExportFormatToConfirm] = useState<{ label: string, fn: () => void } | null>(null);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [toast, setToast] = useState<ToastInfo>(null);

    // Custom persona form state
    const [personaName, setPersonaName] = useState('');
    const [personaPrompt, setPersonaPrompt] = useState('');

    useEffect(() => {
        setSelectedSessionIds(sessions.map(s => s.id));
    }, [sessions]);

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
        if (customPersonas.length >= 3) {
            showToast('Maximum 3 custom personas allowed. Delete one first.', 'error');
            return;
        }
        const id = addCustomPersona({ name: personaName.trim(), systemPrompt: personaPrompt.trim() });
        if (id) {
            setActivePersona(id);
            setPersonaName('');
            setPersonaPrompt('');
            showToast(`Custom persona "${personaName.trim()}" saved and activated!`);
        }
    };

    const handleDeleteCustomPersona = (id: string, name: string) => {
        deleteCustomPersona(id);
        showToast(`"${name}" persona removed.`);
    };

    const handleRestoreDefaults = () => {
        setTheme('system');
        setFontSize('md');
        setEnterToSend(true);
        setAutoScroll(true);
        setActivePersona('general');
        showToast('Settings restored to defaults.');
        setRestoreConfirmOpen(false);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Sliders },
        { id: 'personas', label: 'Personas', icon: User },
        { id: 'data', label: 'Data', icon: DatabaseBackup },
    ] as const;

    return (
        <>
            {/* Custom Confirm Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-3 text-destructive">
                            <div className="p-2 rounded-full bg-destructive/10">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <span>Delete All Chats?</span>
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm">
                            This will permanently delete <strong>all</strong> chat sessions and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} className="sm:flex-1">Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmClear} className="sm:flex-1">Yes, Delete Everything</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Persona Delete Confirm Dialog */}
            <Dialog open={!!personaToDelete} onOpenChange={(open) => !open && setPersonaToDelete(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl z-[200]">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-3 text-destructive">
                            <div className="p-2 rounded-full bg-destructive/10">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <span>Delete "{personaToDelete?.name}"?</span>
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm">
                            This custom persona will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setPersonaToDelete(null)} className="sm:flex-1">Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (personaToDelete) {
                                deleteCustomPersona(personaToDelete.id);
                                showToast(`"${personaToDelete.name}" persona removed.`);
                            }
                            setPersonaToDelete(null);
                        }} className="sm:flex-1">Yes, Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Confirm Dialog */}
            <Dialog open={!!exportFormatToConfirm} onOpenChange={(open) => !open && setExportFormatToConfirm(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl z-[200]">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-3 text-primary">
                            <div className="p-2 rounded-full bg-primary/10">
                                <Download className="h-5 w-5" />
                            </div>
                            <span>Export Data?</span>
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm">
                            Download {selectedSessionIds.length} session{selectedSessionIds.length !== 1 ? 's' : ''} as {exportFormatToConfirm?.label}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setExportFormatToConfirm(null)} className="sm:flex-1">Cancel</Button>
                        <Button onClick={() => {
                            exportFormatToConfirm?.fn();
                            setExportFormatToConfirm(null);
                        }} className="sm:flex-1">Download Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Defaults Confirm Dialog */}
            <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl z-[200]">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <span>Restore Defaults?</span>
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm">
                            This will reset your theme, font size, active persona, and layout behaviors back to their original settings.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setRestoreConfirmOpen(false)} className="sm:flex-1">Cancel</Button>
                        <Button onClick={handleRestoreDefaults} className="sm:flex-1">Yes, Restore</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-sm font-medium transition-all duration-300 animate-in slide-in-from-top-4",
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'
                )}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {toast.message}
                </div>
            )}

            {/* Main Settings Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/80" title="Settings">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-background sm:rounded-2xl border-border text-foreground w-[95vw] sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[680px] shadow-2xl">

                    {/* Sidebar - Desktop: show labels, Mobile: icons only scrollable top bar */}
                    <div className="shrink-0 w-full md:w-64 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 flex flex-col z-10">
                        <div className="p-4 md:p-6 pb-2 md:pb-6">
                            <DialogTitle className="text-xl font-bold tracking-tight">Settings</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-1.5 hidden md:block">
                                Manage your workspace preferences.
                            </DialogDescription>
                        </div>

                        <nav className="px-3 pb-3 md:px-4 md:pb-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible scrollbar-hide md:flex-1 w-full">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0",
                                            "min-w-[44px] md:min-w-full",
                                            isActive
                                                ? 'bg-primary/10 text-primary shadow-sm'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 md:h-4 md:w-4 shrink-0", isActive && "text-primary")} />
                                        <span className="hidden md:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Desktop Restore Button (hidden on mobile) */}
                        <div className="hidden md:flex mt-auto px-4 pb-6">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 rounded-xl transition-colors"
                                onClick={() => setRestoreConfirmOpen(true)}
                            >
                                <RotateCcw className="h-4 w-4 mr-2 shrink-0" />
                                Restore Defaults
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 bg-background relative">
                        <div className="p-4 md:p-6 pb-4 border-b border-border/50 shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                                {(() => {
                                    const Icon = tabs.find(t => t.id === activeTab)?.icon as React.ElementType;
                                    return <Icon className="h-5 w-5 text-primary/80" />;
                                })()}
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                        </div>

                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 md:p-6 space-y-6 pb-8">

                                {/* ── GENERAL ─────────────────────────────── */}
                                {activeTab === 'general' && (
                                    <div className="space-y-4">

                                        {/* Theme */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Theme Appearance</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Select your preferred interface theme.</p>
                                            </div>
                                            <Select value={theme} onValueChange={setTheme}>
                                                <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" /> System</div></SelectItem>
                                                    <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div></SelectItem>
                                                    <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Font Size */}
                                        <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Type className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Adjust text size for readability, especially for medical terminology.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {(['sm', 'md', 'lg'] as const).map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setFontSize(size)}
                                                        className={cn(
                                                            "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                                            fontSize === size
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                                : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        )}
                                                    >
                                                        {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Enter to Send */}
                                        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Enter to Send</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {enterToSend
                                                        ? 'Enter sends message. Shift + Enter for new line.'
                                                        : 'Enter adds new line. Shift + Enter to send.'}
                                                </p>
                                            </div>
                                            <Switch
                                                id="enter-to-send"
                                                checked={enterToSend}
                                                onCheckedChange={setEnterToSend}
                                            />
                                        </div>

                                        {/* Auto Scroll */}
                                        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <ChevronsDown className="h-4 w-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold text-foreground">Auto-Scroll</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground max-w-[80%]">
                                                    {autoScroll
                                                        ? 'Automatically scroll to latest response as it generates.'
                                                        : 'Manual scroll with jump button.'}
                                                </p>
                                            </div>
                                            <Switch
                                                id="auto-scroll"
                                                checked={autoScroll}
                                                onCheckedChange={setAutoScroll}
                                            />
                                        </div>

                                    </div>
                                )}

                                {/* ── PERSONAS ─────────────────────────────── */}
                                {activeTab === 'personas' && (
                                    <div className="space-y-6">
                                        {/* Built-in Personas */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground px-1">Built-in Personas</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {PERSONAS.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setActivePersona(p.id)}
                                                        className={cn(
                                                            "w-full text-left px-4 py-3 rounded-xl border transition-all",
                                                            activePersonaId === p.id
                                                                ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                                                                : 'border-border/60 bg-card hover:border-border hover:bg-muted/50 text-muted-foreground'
                                                        )}
                                                    >
                                                        <div className="font-semibold text-sm text-foreground">{p.name}</div>
                                                        <div className="text-xs mt-1 leading-relaxed line-clamp-2">{p.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Saved Custom Personas */}
                                        {customPersonas.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <h3 className="text-sm font-semibold text-foreground">Your Custom Personas</h3>
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{customPersonas.length}/3</span>
                                                </div>
                                                <div className="grid gap-3">
                                                    {customPersonas.map(cp => (
                                                        <div
                                                            key={cp.id}
                                                            className={cn(
                                                                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                                                                activePersonaId === cp.id
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : 'border-border/60 bg-card hover:border-border'
                                                            )}
                                                        >
                                                            <button
                                                                className="flex-1 text-left min-w-0"
                                                                onClick={() => setActivePersona(cp.id)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-foreground truncate">✨ {cp.name}</span>
                                                                    {activePersonaId === cp.id && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide uppercase">Active</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate mt-1">{cp.systemPrompt}</p>
                                                            </button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                                                                onClick={() => setPersonaToDelete({ id: cp.id, name: cp.name })}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Create New Custom Persona */}
                                        <div className="space-y-4 p-5 rounded-xl border border-border/60 bg-card">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">Create Custom Persona</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Design a persona with custom instructions.</p>
                                                </div>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {customPersonas.length >= 3 ? 'Max reached' : `${3 - customPersonas.length} slot${3 - customPersonas.length !== 1 ? 's' : ''} left`}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Persona name (e.g. My Cardiologist)"
                                                    value={personaName}
                                                    onChange={e => setPersonaName(e.target.value)}
                                                    disabled={customPersonas.length >= 3}
                                                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-shadow"
                                                />
                                                <textarea
                                                    placeholder="Write your custom system prompt here..."
                                                    value={personaPrompt}
                                                    onChange={e => setPersonaPrompt(e.target.value)}
                                                    rows={4}
                                                    disabled={customPersonas.length >= 3}
                                                    className="w-full px-4 py-3 text-sm rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50 transition-shadow"
                                                />
                                                <Button
                                                    onClick={handleSaveCustomPersona}
                                                    disabled={customPersonas.length >= 3 || !personaName.trim() || !personaPrompt.trim()}
                                                    className="w-full rounded-lg"
                                                >
                                                    Save & Activate
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── DATA ────────────────────────────────── */}
                                {activeTab === 'data' && (
                                    <div className="space-y-6">

                                        {/* Export */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">Export Sessions</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Download your chat history.</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                                                    <Switch id="anonymize-mode" checked={isAnonymized} onCheckedChange={setIsAnonymized} className="scale-75 md:scale-90 m-0" />
                                                    <label htmlFor="anonymize-mode" className="text-xs font-medium cursor-pointer text-foreground select-none">Anonymize</label>
                                                </div>
                                            </div>

                                            <div className="border border-border/60 rounded-xl p-4 bg-card space-y-4 shadow-sm">
                                                <ScrollArea className="h-[200px] rounded-lg border border-border/80 bg-background p-2">
                                                    {sessions.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                                            <DatabaseBackup className="h-8 w-8 mb-2 opacity-20" />
                                                            <p className="text-sm">No sessions yet.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {sessions.map(session => (
                                                                <div key={session.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted/60 rounded-md transition-colors">
                                                                    <Checkbox
                                                                        id={`export-${session.id}`}
                                                                        checked={selectedSessionIds.includes(session.id)}
                                                                        onCheckedChange={(checked) => handleToggleSession(session.id, checked as boolean)}
                                                                        className="rounded-[4px]"
                                                                    />
                                                                    <label htmlFor={`export-${session.id}`} className="text-sm flex-1 truncate cursor-pointer select-none font-medium text-foreground">
                                                                        {session.title || 'Untitled Session'}
                                                                    </label>
                                                                    <span className="text-[11px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                                                                        {new Date(session.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                                    {[
                                                        { label: 'TXT', icon: FileText, fn: handleExportTxt },
                                                        { label: 'PDF', icon: Download, fn: handleExportPdf },
                                                        { label: 'MD', icon: FileCode, fn: handleExportMd },
                                                        { label: 'CSV', icon: Database, fn: handleExportCsv },
                                                        { label: 'JSON', icon: FileCode, fn: handleExportJson },
                                                    ].map(({ label, icon: Icon, fn }) => (
                                                        <Button key={label} size="sm" variant="outline" className="rounded-lg h-9 bg-background hover:bg-muted" onClick={() => setExportFormatToConfirm({ label, fn })} disabled={selectedSessionIds.length === 0}>
                                                            <Icon className="mr-2 h-4 w-4" /> {label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Import */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">Import Chat History</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">Restore a previously exported JSON backup.</p>
                                            </div>
                                            <div>
                                                <input type="file" id="import-json" accept=".json" className="hidden" onChange={handleImport} />
                                                <label htmlFor="import-json">
                                                    <Button asChild variant="outline" className="cursor-pointer rounded-lg bg-background hover:bg-muted w-full sm:w-auto">
                                                        <span><Download className="mr-2 h-4 w-4 rotate-180" /> Import JSON</span>
                                                    </Button>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                                                </h3>
                                                <p className="text-xs text-destructive/80 mt-1">Permanently delete all chat history. This cannot be undone.</p>
                                            </div>
                                            <Button variant="destructive" className="rounded-lg shrink-0 w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
                                                Clear All Chats
                                            </Button>
                                        </div>

                                    </div>
                                )}

                            </div>
                        </ScrollArea>
                    </div>

                    {/* Mobile Restore Button (pinned to bottom only on mobile view) */}
                    <div className="md:hidden p-4 border-t border-border/50 shrink-0 bg-background/50 backdrop-blur-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => setRestoreConfirmOpen(true)}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore Defaults
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
}