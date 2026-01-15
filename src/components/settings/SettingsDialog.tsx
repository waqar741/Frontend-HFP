'use client';

import { Settings, Download, Sun, Moon, Monitor } from 'lucide-react';
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
import { useChatStore } from '@/hooks/useChatStore';
import { exportChatToText } from '@/lib/export-utils';
import { useTheme } from 'next-themes';

export function SettingsDialog() {
    const { currentSessionId, sessions } = useChatStore();
    const { theme, setTheme } = useTheme();
    const currentSession = sessions.find(s => s.id === currentSessionId);

    const handleExport = () => {
        if (currentSession) {
            exportChatToText(currentSession);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Customize your secure workspace preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Appearance Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Appearance</h4>
                        <div className="rounded-md border border-border bg-muted p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="text-sm font-medium">Theme</p>
                                    <p className="text-xs text-muted-foreground truncate">Select your preferred interface theme</p>
                                </div>
                                <div className="min-w-[140px] w-full sm:w-auto">
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger className="h-8 bg-background border-input w-full">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                        <h4 className="font-medium leading-none">Patient Data Export</h4>
                        <div className="rounded-md border border-border bg-muted p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Current Session Record</p>
                                    <p className="text-xs text-muted-foreground">Download as secure .txt report</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
                                    onClick={handleExport}
                                    disabled={!currentSession}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
