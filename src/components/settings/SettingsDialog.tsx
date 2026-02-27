import { useState, useEffect } from 'react';
import { Settings, Download, FileText, Sun, Moon, Monitor, FileCode, Database } from 'lucide-react';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from '@/hooks/useChatStore';
import { exportAllChatsToText, exportAllChatsToPDF, exportAllChatsToMarkdown, exportAllChatsToCSV } from '@/lib/export-utils';
import { useTheme } from 'next-themes';

export function SettingsDialog() {
    const { currentSessionId, sessions } = useChatStore();
    const { theme, setTheme } = useTheme();

    // Export state
    const [isAnonymized, setIsAnonymized] = useState(false);
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

    // Initialize all sessions as selected when they load
    useEffect(() => {
        setSelectedSessionIds(sessions.map(s => s.id));
    }, [sessions]);

    const getSelectedSessions = () => sessions.filter(s => selectedSessionIds.includes(s.id));

    const handleToggleSession = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedSessionIds(prev => [...prev, id]);
        } else {
            setSelectedSessionIds(prev => prev.filter(sId => sId !== id));
        }
    };

    const handleExportTxt = () => {
        const selected = getSelectedSessions();
        if (selected.length > 0) exportAllChatsToText(selected, isAnonymized);
    };

    const handleExportPdf = () => {
        const selected = getSelectedSessions();
        if (selected.length > 0) exportAllChatsToPDF(selected, isAnonymized);
    };

    const handleExportMd = () => {
        const selected = getSelectedSessions();
        if (selected.length > 0) exportAllChatsToMarkdown(selected, isAnonymized);
    };

    const handleExportCsv = () => {
        const selected = getSelectedSessions();
        if (selected.length > 0) exportAllChatsToCSV(selected, isAnonymized);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground sm:max-w-[425px] px-4 pt-6 pb-6 lg:px-6">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Settings</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Customize your secure workspace preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2 py-4">
                    {/* Appearance Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none text-foreground">Appearance</h4>
                        <div className="rounded-lg border border-border bg-secondary/50 dark:bg-secondary/30 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">Theme</p>
                                    <p className="text-xs text-muted-foreground truncate">Select your preferred interface theme</p>
                                </div>
                                <div className="min-w-[140px] w-full sm:w-auto">
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger className="h-8 bg-background dark:bg-background border-border text-foreground w-full">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="system">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="h-4 w-4" />
                                                    <span>System</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="light">
                                                <div className="flex items-center gap-2">
                                                    <Sun className="h-4 w-4" />
                                                    <span>Light</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="dark">
                                                <div className="flex items-center gap-2">
                                                    <Moon className="h-4 w-4" />
                                                    <span>Dark</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Export Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none text-foreground">Patient Data Export</h4>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="anonymize-mode"
                                    checked={isAnonymized}
                                    onCheckedChange={setIsAnonymized}
                                />
                                <label htmlFor="anonymize-mode" className="text-xs font-medium cursor-pointer text-muted-foreground select-none">
                                    Anonymize PII
                                </label>
                            </div>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/50 dark:bg-secondary/30 p-4 space-y-4">

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Select Sessions</p>
                                <ScrollArea className="h-[120px] rounded-md border border-border bg-background p-2">
                                    {sessions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2">No sessions available.</p>
                                    ) : (
                                        <div className="space-y-2 pr-6">
                                            {sessions.map(session => (
                                                <div key={session.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`export-${session.id}`}
                                                        checked={selectedSessionIds.includes(session.id)}
                                                        onCheckedChange={(checked) => handleToggleSession(session.id, checked as boolean)}
                                                    />
                                                    <label
                                                        htmlFor={`export-${session.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate cursor-pointer select-none"
                                                    >
                                                        {session.title || 'Untitled Session'}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full bg-secondary dark:bg-secondary/50 text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                    onClick={handleExportTxt}
                                    disabled={selectedSessionIds.length === 0}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    TXT
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full bg-secondary dark:bg-secondary/50 text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                    onClick={handleExportPdf}
                                    disabled={selectedSessionIds.length === 0}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full bg-secondary dark:bg-secondary/50 text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                    onClick={handleExportMd}
                                    disabled={selectedSessionIds.length === 0}
                                >
                                    <FileCode className="mr-2 h-4 w-4" />
                                    MD
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full bg-secondary dark:bg-secondary/50 text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                    onClick={handleExportCsv}
                                    disabled={selectedSessionIds.length === 0}
                                >
                                    <Database className="mr-2 h-4 w-4" />
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
