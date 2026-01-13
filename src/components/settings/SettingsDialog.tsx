'use client';

import { Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function SettingsDialog() {
    const { currentSessionId, sessions } = useChatStore();
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
                    {/* Data Export Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Patient Data Export</h4>
                        <div className="rounded-md border border-border bg-muted p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Current Session Record</p>
                                    <p className="text-xs text-muted-foreground">Download as secure .txt report</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
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
