'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Cpu, Server, Activity, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const nodes = [
    {
        value: 'hfp-diagnostic-v1',
        label: 'HFP-Diagnostic-v1',
        status: 'online',
        type: 'core',
    },
    {
        value: 'local-backup',
        label: 'Local Backup',
        status: 'offline',
        type: 'local',
    },
    {
        value: 'cloud-v2',
        label: 'Cloud v2',
        status: 'online',
        type: 'cloud',
    },
    {
        value: 'research-beta',
        label: 'Research Beta',
        status: 'busy',
        type: 'cloud',
    },
];

// ... imports
export function NodeSelector({ className }: { className?: string }) {
    const [open, setOpen] = React.useState(false);
    const [selectedNode, setSelectedNode] = React.useState('hfp-diagnostic-v1');
    const [isScanning, setIsScanning] = React.useState(false);

    // Simulate scanning when opening or typing
    React.useEffect(() => {
        if (open) {
            setIsScanning(true);
            const timer = setTimeout(() => setIsScanning(false), 800);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const selectedNodeData = nodes.find((node) => node.value === selectedNode);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-8 gap-2 rounded-full bg-muted/50 px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
                        className
                    )}
                >
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        selectedNodeData?.status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                            selectedNodeData?.status === 'busy' ? "bg-amber-500" : "bg-slate-500"
                    )} />
                    <span className="truncate max-w-[150px]">{selectedNodeData?.label}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 bg-popover border-border text-popover-foreground">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search nodes..." className="text-foreground placeholder:text-muted-foreground" />
                    <CommandList>
                        {isScanning ? (
                            <div className="py-6 text-center text-sm text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                                <Activity className="h-4 w-4 animate-spin" />
                                <span>Scanning network...</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No node found.</CommandEmpty>
                                <CommandGroup heading="Available Nodes" className="text-muted-foreground">
                                    {nodes.map((node) => (
                                        <CommandItem
                                            key={node.value}
                                            value={node.label}
                                            onSelect={(currentValue) => {
                                                const found = nodes.find(n => n.label.toLowerCase() === currentValue.toLowerCase()) || node;
                                                setSelectedNode(found.value);
                                                setOpen(false);
                                            }}
                                            className="text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                                        >
                                            <div className={cn(
                                                "mr-2 h-2 w-2 rounded-full",
                                                node.status === 'online' ? "bg-green-500" :
                                                    node.status === 'busy' ? "bg-amber-500" : "bg-slate-500"
                                            )} />
                                            {node.type === 'local' ? <Cpu className="mr-2 h-4 w-4 opacity-70" /> : <Server className="mr-2 h-4 w-4 opacity-70" />}
                                            {node.label}
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    selectedNode === node.value ? "opacity-100 text-hfp-teal" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
