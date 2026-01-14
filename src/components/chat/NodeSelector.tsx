'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Activity, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useChatStore } from '@/hooks/useChatStore';

export function NodeSelector({ className }: { className?: string }) {
    const [open, setOpen] = React.useState(false);
    const { availableNodes, activeNodeAddress, fetchNodes, setActiveNode } = useChatStore();
    const [isScanning, setIsScanning] = React.useState(false);

    // Rotating model name state for Auto mode
    const [rotatedModelIndex, setRotatedModelIndex] = React.useState(0);

    // Initial scan on mount
    React.useEffect(() => {
        const scan = async () => {
            setIsScanning(true);
            await fetchNodes();
            setIsScanning(false);
        };
        scan();
    }, [fetchNodes]);

    // Rotation effect
    React.useEffect(() => {
        if (!activeNodeAddress && availableNodes.length > 0) {
            const interval = setInterval(() => {
                setRotatedModelIndex((prev) => (prev + 1) % availableNodes.length);
            }, 10000); // 10 seconds
            return () => clearInterval(interval);
        }
    }, [activeNodeAddress, availableNodes.length]);

    const activeNode = availableNodes.find((node) => node.address === activeNodeAddress);

    // Determine display name
    const displayName = activeNode
        ? activeNode.given_name
        : (availableNodes.length > 0 ? availableNodes[rotatedModelIndex].model_name : "Auto / Dynamic");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-8 gap-2 rounded-full px-3 text-xs font-medium border transition-all",
                        open && "shadow-[0_0_10px_rgba(59,130,246,0.2)]",
                        className
                    )}
                >
                    {/* Status Dot with Glow */}
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-500",
                        activeNode
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                    )} />

                    <span className="truncate max-w-[150px] font-sans">
                        {displayName}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-popover border-border text-popover-foreground shadow-2xl rounded-2xl overflow-hidden">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search nodes..." className="text-foreground placeholder:text-muted-foreground border-b border-border" />
                    <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {isScanning ? (
                            <div className="py-8 text-center text-sm text-slate-400 animate-pulse flex flex-col items-center gap-3">
                                <Activity className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="text-xs font-medium">Scanning secure network...</span>
                            </div>
                        ) : availableNodes.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <span className="text-xs">No active nodes online.</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="py-6 text-center text-sm text-slate-500">No node found.</CommandEmpty>
                                <CommandGroup heading="Available Processing Nodes" className="text-slate-500 font-medium px-2 py-2">
                                    {availableNodes.map((node) => (
                                        <CommandItem
                                            key={node.address}
                                            value={`${node.given_name} ${node.model_name}`}
                                            onSelect={() => {
                                                // Toggle logic: If clicking the active node, switch to Auto (empty string)
                                                if (activeNodeAddress === node.address) {
                                                    setActiveNode("");
                                                } else {
                                                    setActiveNode(node.address);
                                                }
                                                setOpen(false);
                                            }}
                                            className="text-slate-200 aria-selected:bg-blue-600/20 aria-selected:text-blue-100 cursor-pointer rounded-lg my-1 transition-colors group"
                                        >
                                            <div className="flex items-center w-full py-1">
                                                <div className={cn(
                                                    "mr-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                )} />
                                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                                    <span className="font-semibold text-sm truncate group-aria-selected:text-blue-200">{node.given_name}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono truncate group-aria-selected:text-blue-300/70">{node.model_status} • {node.model_name}</span>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4 shrink-0 transition-opacity",
                                                        (activeNodeAddress === node.address || (!activeNodeAddress && node.model_name === displayName))
                                                            ? "opacity-100 text-blue-400"
                                                            : "opacity-0"
                                                    )}
                                                />
                                            </div>
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
