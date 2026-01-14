'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Activity, AlertCircle, Sparkles } from 'lucide-react';
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
import { ScrollArea } from "@/components/ui/scroll-area";

export function NodeSelector({ className }: { className?: string }) {
    const [open, setOpen] = React.useState(false);
    const { availableNodes, activeNodeAddress, fetchNodes, setActiveNode, lastUsedModel } = useChatStore();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isScanning, setIsScanning] = React.useState(false);

    // Initial scan on mount and poll every 10s
    React.useEffect(() => {
        const scan = async () => {
            // Only set scanning UI on initial load if empty
            if (availableNodes.length === 0) setIsScanning(true);
            await fetchNodes();
            setIsScanning(false);
        };
        scan();

        const interval = setInterval(() => {
            fetchNodes();
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [fetchNodes, availableNodes.length]);

    // Format helper to remove .gguf
    const formatModelName = (name: string | null | undefined): string => {
        if (!name) return 'Loading...';
        return name.replace(/\.gguf$/i, '');
    };

    // Helper to extract size (e.g., 7B, 1.5B)
    const itemSize = (modelName: string | undefined): string => {
        if (!modelName) return '';
        const parts = modelName.split('-');
        const lastPart = parts[parts.length - 1];

        if (lastPart.includes('B')) {
            return lastPart;
        }

        const sizeMatch = modelName.match(/(\d+B|\d+\.\d+B)/i);
        return sizeMatch ? sizeMatch[1] : '';
    };

    const ignoredNodes = ['digital-ocean-server', 'server2-ritesh'];

    const sortedNodes = React.useMemo(() => {
        return availableNodes
            .filter((n) => !ignoredNodes.includes(n.given_name))
            .filter((n) => {
                const nodeStatus = (n.status || '').toLowerCase();
                const modelStatus = (n.model_status || '').toLowerCase();
                const modelName = (n.model_name || '');

                const isNodeUp = nodeStatus === 'online' || nodeStatus === 'healthy';
                const isModelUp = modelStatus === 'online' || modelStatus === 'healthy';
                const hasValidModel = modelName !== 'N/A' && modelName !== '';

                return isNodeUp && isModelUp && hasValidModel;
            })
            .filter((n) => {
                const term = searchTerm.toLowerCase();
                return n.given_name.toLowerCase().includes(term) ||
                    (n.model_name || '').toLowerCase().includes(term);
            })
            .sort((a, b) => {
                // Determine if nodes are "Local Backup"
                const isALocal = a.given_name === 'Local Backup';
                const isBLocal = b.given_name === 'Local Backup';

                // If both are local or both are not local, sort alphabetically
                if (isALocal === isBLocal) {
                    return a.given_name.localeCompare(b.given_name);
                }

                // If A is local, it goes after B (return 1)
                // If B is local, A goes before B (return -1)
                return isALocal ? 1 : -1;
            });
    }, [availableNodes, searchTerm]);

    const activeNode = availableNodes.find((node) => node.address === activeNodeAddress);

    // Determine display model name
    let displayModelName = "Auto / Dynamic";
    if (activeNodeAddress && activeNode) {
        displayModelName = activeNode.model_name;
    } else if (!activeNodeAddress) {
        // Auto Mode Logic:
        // 1. If we have a healthy node in the list, use that as the likely target
        // 2. Fallback to lastUsedModel if no nodes currently healthy but we have history
        if (sortedNodes.length > 0) {
            displayModelName = sortedNodes[0].model_name;
        } else if (lastUsedModel) {
            displayModelName = lastUsedModel;
        }
    }

    const isAutoMode = !activeNodeAddress;

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) {
                setSearchTerm('');
                fetchNodes();
            }
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-8 gap-2 rounded-md px-3 text-sm font-medium transition-colors max-w-[200px] sm:max-w-[400px]",
                        activeNodeAddress
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        className
                    )}
                >
                    {activeNodeAddress ? (
                        <Activity className="h-4 w-4 shrink-0" />
                    ) : (
                        <Sparkles className="h-4 w-4 shrink-0 opacity-70" />
                    )}

                    <span className="truncate block max-w-[150px] sm:max-w-[350px] text-left">
                        {formatModelName(displayModelName)}
                    </span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[calc(100vw-32px)] max-w-[350px] sm:w-[350px] p-0 shadow-lg rounded-lg overflow-hidden"
                align="end"
            >
                <div className="flex flex-col">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b flex justify-between items-center">
                        <span>Select Processing Node</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveNode("");
                                    setOpen(false);
                                }}
                                className={cn(
                                    "h-5 px-2 text-[10px] font-bold gap-1 transition-all",
                                    isAutoMode
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                        : "hover:bg-primary/10 hover:text-primary"
                                )}
                            >
                                <Sparkles className="h-3 w-3" />
                                AUTO
                            </Button>
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                                {sortedNodes.length} ONLINE
                            </span>
                        </div>
                    </div>

                    <div className="p-1 border-b">
                        <Command className="border rounded-md">
                            <CommandInput
                                placeholder="Search nodes..."
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                className="h-7 text-xs"
                            />
                        </Command>
                    </div>

                    <ScrollArea className="h-auto max-h-[250px]">
                        <div className="p-1 space-y-0.5">
                            {isScanning && sortedNodes.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-400 animate-pulse flex flex-col items-center gap-3">
                                    <Activity className="h-5 w-5 animate-spin text-blue-500" />
                                    <span className="text-xs font-medium">Scanning network...</span>
                                </div>
                            ) : sortedNodes.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    No healthy nodes found.
                                </div>
                            ) : (
                                sortedNodes.map((node) => {
                                    const isSelected = activeNodeAddress === node.address;
                                    const formattedModelName = formatModelName(node.model_name);

                                    return (
                                        <button
                                            key={node.address}
                                            type="button"
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors text-left group",
                                                isSelected
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : "hover:bg-muted text-foreground"
                                            )}
                                            onClick={() => {
                                                if (activeNodeAddress !== node.address) {
                                                    setActiveNode(node.address);
                                                }
                                                // Always close, do not toggle off
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                                                <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                                                    <span className="font-medium truncate block leading-tight">
                                                        {node.given_name}
                                                    </span>
                                                    {formattedModelName && (
                                                        <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                                            <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-full">
                                                                {formattedModelName}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground opacity-70 shrink-0">
                                                                {itemSize(formattedModelName)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 ml-2" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
