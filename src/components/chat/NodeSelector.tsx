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
                        "h-8 gap-2 rounded-full bg-slate-800/50 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50",
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
            <PopoverContent className="w-[250px] p-0 bg-hfp-card border-slate-700 text-slate-100">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search nodes..." className="text-slate-100 placeholder:text-slate-500" />
                    <CommandList>
                        {isScanning ? (
                            <div className="py-6 text-center text-sm text-slate-400 animate-pulse flex flex-col items-center gap-2">
                                <Activity className="h-4 w-4 animate-spin" />
                                <span>Scanning network...</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No node found.</CommandEmpty>
                                <CommandGroup heading="Available Nodes" className="text-slate-400">
                                    {nodes.map((node) => (
                                        <CommandItem
                                            key={node.value}
                                            value={node.label} // Searching by label usually better UX
                                            onSelect={(currentValue) => {
                                                // CommandItem returns the value in lowercase/normalized usually, but we want to match our specific values. 
                                                // Actually Command uses the 'value' prop for filtering but onSelect returns the value.
                                                // Let's rely on finding by label since we passed label as value here? 
                                                // No, let's keep it safe. 
                                                const found = nodes.find(n => n.label.toLowerCase() === currentValue.toLowerCase()) || node;
                                                setSelectedNode(found.value);
                                                setOpen(false);
                                            }}
                                            className="text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white cursor-pointer"
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
