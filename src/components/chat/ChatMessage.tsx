'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, RotateCw, Check, X, ChevronLeft, ChevronRight, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, MessageVersion } from '@/types/chat';

interface ChatMessageProps {
    message: Message;
    isLast: boolean;
    modelName?: string;
    onEdit?: (newContent: string) => void;
    onRegenerate?: () => void;
    onCopy?: (content: string) => void;
    onDelete?: () => void;
    onVersionChange?: (versionIndex: number | undefined) => void;
}

export function ChatMessage({
    message,
    isLast,
    modelName,
    onEdit,
    onRegenerate,
    onCopy,
    onDelete,
    onVersionChange,
}: ChatMessageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const [viewingVersionIndex, setViewingVersionIndex] = useState<number | undefined>(undefined);
    const messageRef = useRef<HTMLDivElement>(null);

    const isUser = message.role === 'user';
    const isStreaming = !isUser && isLast && message.content && !message.stats;

    // Version navigation
    const versions = message.previousVersions || [];
    const totalVersions = versions.length + 1; // previous + current
    const isViewingOldVersion = viewingVersionIndex !== undefined;
    const currentViewIndex = isViewingOldVersion ? viewingVersionIndex : versions.length; // 0-indexed, latest = versions.length

    // Get the content/stats/model for the currently viewed version
    let displayContent = message.content;
    let displayStats = message.stats;
    let displayModel = message.model || modelName || message.modelName;

    if (isViewingOldVersion && viewingVersionIndex < versions.length) {
        const ver = versions[viewingVersionIndex];
        displayContent = ver.content;
        displayStats = ver.stats;
        displayModel = ver.model || ver.modelName;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(displayContent);
        setShowCopyToast(true);
        onCopy?.(displayContent);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    const handleSaveEdit = () => {
        if (editedContent.trim() && onEdit) {
            onEdit(editedContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };

    const goToPrevVersion = () => {
        if (currentViewIndex > 0) {
            const newIndex = currentViewIndex - 1;
            setViewingVersionIndex(newIndex);
            onVersionChange?.(newIndex);
        }
    };

    const goToNextVersion = () => {
        if (currentViewIndex < versions.length) {
            const newIndex = currentViewIndex + 1;
            // If at latest, set to undefined
            if (newIndex >= versions.length) {
                setViewingVersionIndex(undefined);
                onVersionChange?.(undefined);
            } else {
                setViewingVersionIndex(newIndex);
                onVersionChange?.(newIndex);
            }
        }
    };

    return (
        <div
            ref={messageRef}
            className={cn(
                'group relative flex w-full gap-3 px-3 md:px-6 py-2',
                isUser ? 'animate-message-user' : 'animate-message-ai'
            )}
        >
            {/* Copy Toast - Fixed at bottom center */}
            {showCopyToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-toast pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium shadow-xl">
                        <Check className="h-3.5 w-3.5" />
                        Copied to clipboard
                    </div>
                </div>
            )}

            <div className="flex w-full flex-col">
                {isUser ? (
                    /* User Message - Right Aligned Bubble */
                    <div className="flex justify-end">
                        <div className="flex flex-col items-end max-w-[800px]">
                            <div
                                className={cn(
                                    'user-bubble relative rounded-2xl px-4 py-2 text-sm md:text-base shadow-sm',
                                    'bg-[#0ea5e9] text-white rounded-tr-sm'
                                )}
                            >
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full min-h-[60px] resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleCancelEdit}
                                                className="h-7 px-2 gap-1 text-xs"
                                            >
                                                <X className="h-3 w-3" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                className="h-7 px-2 gap-1 bg-blue-600 hover:bg-blue-500 text-xs"
                                            >
                                                <Check className="h-3 w-3" />
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                )}
                            </div>

                            {/* Action Buttons - User Messages */}
                            {!isEditing && (
                                <div className="message-actions flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setIsEditing(true)}
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors duration-150"
                                            title="Edit message"
                                        >
                                            <Pen className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors duration-150"
                                        title="Copy message"
                                    >
                                        {showCopyToast ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* AI Message - Full Width Left Aligned */
                    <div className="ai-message-container w-full max-w-[800px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed dark:prose-p:text-foreground dark:prose-headings:text-foreground prose-code:text-primary overflow-x-auto w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {displayContent}
                            </ReactMarkdown>
                            {/* Streaming cursor */}
                            {isStreaming && !isViewingOldVersion && (
                                <span className="animate-cursor-blink inline-block w-[2px] h-[1em] bg-primary align-text-bottom ml-0.5" />
                            )}
                        </div>

                        {/* Metadata Footer - AI Messages */}
                        <div className={cn(
                            "flex flex-col w-full mt-2 gap-2 select-none",
                            displayStats && "animate-fade-in-up"
                        )}>
                            {/* Row 1: Metrics & Model */}
                            <div className="flex items-center w-full max-w-full">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 py-0.5 w-fit">
                                    {/* Model Name */}
                                    <span className="font-semibold text-xs text-foreground/80 leading-tight shrink-1 break-words">
                                        {(displayModel || 'Unknown Model').toString().replace(/\.gguf$/i, '')}
                                    </span>

                                    {displayStats && (
                                        <>
                                            <div className="hidden sm:block h-3.5 w-px bg-border shrink-0" />
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium">
                                                {displayStats.tokens !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Tokens Generated">
                                                        <span className="text-[10px] opacity-100 bg-muted text-muted-foreground px-1 py-0.5 rounded border border-border/50">ab</span>
                                                        <span>{displayStats.tokens} tokens</span>
                                                    </div>
                                                )}
                                                {displayStats.timeMs !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Generation Time">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-70">
                                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <span>{(displayStats.timeMs / 1000).toFixed(2)}s</span>
                                                    </div>
                                                )}
                                                {displayStats.tokensPerSec !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Tokens per second">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-70">
                                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                                        </svg>
                                                        <span>{displayStats.tokensPerSec.toFixed(2)} tokens/s</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Actions + Version Navigation */}
                            <div className="flex items-center gap-2 pl-1">
                                {/* Actions */}
                                <div className="message-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-all duration-150"
                                        title="Copy response"
                                    >
                                        {showCopyToast ? (
                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                    {isLast && onRegenerate && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={onRegenerate}
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-all duration-150"
                                            title="Regenerate response"
                                        >
                                            <RotateCw className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {/* Version Navigator - shows only when there are previous versions */}
                                {totalVersions > 1 && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={goToPrevVersion}
                                            disabled={currentViewIndex === 0}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-md"
                                            title="Previous version"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-xs text-muted-foreground tabular-nums font-medium min-w-[2rem] text-center">
                                            {currentViewIndex + 1}/{totalVersions}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={goToNextVersion}
                                            disabled={currentViewIndex >= versions.length}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-md"
                                            title="Next version"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
