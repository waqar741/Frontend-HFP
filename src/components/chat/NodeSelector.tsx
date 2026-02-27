'use client';

import * as React from 'react';
import { Check, ChevronDown, Package, Server, Monitor, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useChatStore } from '@/hooks/useChatStore';

export function NodeSelector({ className }: { className?: string }) {
    const [open, setOpen] = React.useState(false);
    const { availableNodes, activeNodeAddress, fetchNodes, setActiveNode } = useChatStore();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isScanning, setIsScanning] = React.useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Initial scan on mount and poll every 5s
    React.useEffect(() => {
        const scan = async () => {
            if (availableNodes.length === 0) setIsScanning(true);
            await fetchNodes();
            setIsScanning(false);
        };
        scan();

        const interval = setInterval(() => {
            fetchNodes();
            if (open) fetchNodes();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchNodes, availableNodes.length, open]);

    // Format helper to remove .gguf
    const formatModelName = (name: string | null | undefined): string => {
        if (!name) return 'Loading...';
        return name.replace(/\.gguf$/i, '');
    };

    // Helper to extract size (e.g., 7B, 1.5B)
    const itemSize = (modelName: string | undefined): string => {
        if (!modelName) return '';
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
            .sort((a, b) => a.given_name.localeCompare(b.given_name));
    }, [availableNodes, searchTerm]);

    const activeNode = availableNodes.find((node) => node.address === activeNodeAddress);

    // Determine display model name - matching Web-UI logic
    let displayModelName = 'Loading...';
    if (activeNodeAddress && activeNode) {
        displayModelName = formatModelName(activeNode.model_name);
    } else if (sortedNodes.length > 0) {
        displayModelName = formatModelName(sortedNodes[0].model_name);
    }

    const toggleNodeSelection = (address: string) => {
        if (activeNodeAddress === address) {
            setActiveNode('');
        } else {
            setActiveNode(address);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) {
                setSearchTerm('');
                fetchNodes();
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
        }}>
            <PopoverTrigger
                className={cn(
                    // Base Layout - matching Web-UI: h-8, text-sm, rounded-md
                    "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    // Colors - matching Web-UI
                    activeNodeAddress
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    // Width controls
                    "max-w-[160px] sm:max-w-[500px]",
                    className
                )}
            >
                {activeNodeAddress ? (
                    <Server className="h-4 w-4 shrink-0" />
                ) : (
                    <Package className="h-4 w-4 shrink-0 opacity-70" />
                )}

                <span className="truncate pb-px block max-w-[110px] sm:max-w-[450px]">
                    {displayModelName}
                </span>

                {isScanning ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-50" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                )}
            </PopoverTrigger>

            <PopoverContent
                className="w-[calc(100vw-32px)] max-w-[400px] sm:w-[400px] p-0 shadow-lg rounded-lg overflow-hidden"
                align="end"
                sideOffset={8}
                side="top"
            >
                <div className="flex flex-col">
                    {/* Header - matching Web-UI */}
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b flex justify-between items-center">
                        <span>Select Processing Node</span>
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                            {sortedNodes.length} Online
                        </span>
                    </div>

                    {/* Search - matching Web-UI */}
                    <div className="p-2 border-b">
                        <input
                            ref={searchInputRef}
                            id="node-search"
                            type="text"
                            placeholder="Search nodes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-muted/50 border border-input rounded-md focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none placeholder:text-muted-foreground text-foreground transition-colors"
                        />
                    </div>

                    {/* Node List - matching Web-UI */}
                    <div className="max-h-[min(50vh,300px)] overflow-y-auto p-1">
                        {sortedNodes.map((node) => {
                            const isSelected = activeNodeAddress === node.address;
                            const formattedModelName = formatModelName(node.model_name);
                            const size = itemSize(formattedModelName);

                            return (
                                <button
                                    key={node.address}
                                    type="button"
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-md px-2 py-2.5 text-sm transition-colors text-left group",
                                        isSelected
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "hover:bg-muted text-foreground"
                                    )}
                                    onClick={() => toggleNodeSelection(node.address)}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Monitor className="h-4 w-4 shrink-0 text-green-500" />
                                        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                                            <span className="font-medium truncate block">
                                                {node.given_name}
                                            </span>
                                            {formattedModelName && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded truncate flex-1 max-w-full">
                                                        {formattedModelName}
                                                    </span>
                                                    {size && (
                                                        <span className="text-[10px] text-muted-foreground opacity-70 shrink-0">
                                                            {size}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 ml-2" />
                                    )}
                                </button>
                            );
                        })}

                        {sortedNodes.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {isScanning ? 'Scanning network...' : 'No healthy nodes found.'}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
