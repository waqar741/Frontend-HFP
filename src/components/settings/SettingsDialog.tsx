'use client';

import { Settings, Download, Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTheme } from '@/hooks/useTheme';
import { useChatStore } from '@/hooks/useChatStore';
import { exportChatToText } from '@/lib/export-utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function SettingsDialog() {
    const { theme, setTheme } = useTheme();
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
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" title="Settings">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-hfp-card border-slate-700 text-slate-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Customize your secure workspace preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Theme Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Appearance</h4>
                        <RadioGroup defaultValue={theme} onValueChange={(val) => setTheme(val as any)} className="grid grid-cols-3 gap-4">
                            <div>
                                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                                <Label
                                    htmlFor="light"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-900 p-4 hover:bg-slate-800 hover:text-white peer-data-[state=checked]:border-hfp-teal peer-data-[state=checked]:text-hfp-teal [&:has([data-state=checked])]:border-hfp-teal"
                                >
                                    <Sun className="mb-3 h-6 w-6" />
                                    Sterile Light
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                                <Label
                                    htmlFor="dark"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-900 p-4 hover:bg-slate-800 hover:text-white peer-data-[state=checked]:border-hfp-teal peer-data-[state=checked]:text-hfp-teal [&:has([data-state=checked])]:border-hfp-teal"
                                >
                                    <Moon className="mb-3 h-6 w-6" />
                                    Clinical Dark
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                                <Label
                                    htmlFor="system"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-900 p-4 hover:bg-slate-800 hover:text-white peer-data-[state=checked]:border-hfp-teal peer-data-[state=checked]:text-hfp-teal [&:has([data-state=checked])]:border-hfp-teal"
                                >
                                    <Laptop className="mb-3 h-6 w-6" />
                                    System
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Data Export Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Patient Data Export</h4>
                        <div className="rounded-md border border-slate-700 bg-slate-900/50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Current Session Record</p>
                                    <p className="text-xs text-slate-500">Download as secure .txt report</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
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
