'use client';

import { useState } from 'react';
import { Copy, RotateCw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types/chat';

interface ChatMessageProps {
    message: Message;
    isLast: boolean;
    modelName?: string;
    onEdit?: (newContent: string) => void;
    onRegenerate?: () => void;
    onCopy?: (content: string) => void;
    onDelete?: () => void;
}

export function ChatMessage({
    message,
    isLast,
    modelName,
    onEdit,
    onRegenerate,
    onCopy,
    onDelete,
}: ChatMessageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isHovered, setIsHovered] = useState(false);

    const isUser = message.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        onCopy?.(message.content);
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

    return (
        <div
            className={cn(
                'group flex w-full gap-3 px-3 md:px-6 py-2 transition-colors duration-200',
                isHovered && 'bg-accent/5'
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex w-full flex-col">
                {isUser ? (
                    /* User Message - Right Aligned Bubble */
                    <div className="flex justify-end">
                        <div className="flex flex-col items-end max-w-[800px]">
                            <div
                                className={cn(
                                    'relative rounded-2xl px-4 py-2 text-sm md:text-base shadow-sm transition-all',
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

                            {/* Action Buttons - User Messages - Always Visible */}
                            {!isEditing && (
                                <div className="flex gap-1 mt-0.5 opacity-100 transition-opacity duration-200">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        title="Copy message"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    {onEdit && (
                                        /* Edit button is intentionally hidden unless needed, but logic remains if requested later */
                                        null
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* AI Message - Full Width Left Aligned */
                    <div className="w-full max-w-[800px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed dark:prose-p:text-foreground dark:prose-headings:text-foreground prose-code:text-primary overflow-x-auto w-full">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>

                        {/* Metadata Footer - AI Messages - Compact & Styled */}
                        <div className="flex flex-col w-full mt-2 gap-2 select-none">
                            {/* Row 1: Metrics & Model - Styled as minimal text */}
                            <div className="flex items-center w-full max-w-full">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 py-0.5 w-fit">
                                    {/* Model Name */}
                                    <span className="font-semibold text-xs text-blue-100/90 leading-tight shrink-1 break-words">
                                        {(message.model || modelName || message.modelName || 'Unknown Model').replace(/\.gguf$/i, '')}
                                    </span>

                                    {message.stats && (
                                        <>
                                            {/* Divider - Hidden on very small screens if wrapped, or just a separator */}
                                            <div className="hidden sm:block h-3.5 w-px bg-white/10 shrink-0" />

                                            {/* Metrics - Allow wrapping */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 font-medium">
                                                {/* Tokens */}
                                                {message.stats.tokens !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Tokens Generated">
                                                        <span className="text-[10px] opacity-70 bg-white/5 p-0.5 rounded">ab</span>
                                                        <span>{message.stats.tokens} tokens</span>
                                                    </div>
                                                )}

                                                {/* Time */}
                                                {message.stats.timeMs !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Generation Time">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="w-3.5 h-3.5 opacity-70"
                                                        >
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <span>{(message.stats.timeMs / 1000).toFixed(2)}s</span>
                                                    </div>
                                                )}

                                                {/* Speed */}
                                                {message.stats.tokensPerSec !== undefined && (
                                                    <div className="flex items-center gap-1.5" title="Tokens per second">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="w-3.5 h-3.5 opacity-70"
                                                        >
                                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                                        </svg>
                                                        <span>{message.stats.tokensPerSec.toFixed(2)} tokens/s</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Actions (Copy, Regenerate, etc.) */}
                            <div className="flex gap-1 opacity-100 transition-opacity duration-200 pl-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md"
                                    title="Copy response"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {isLast && onRegenerate && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={onRegenerate}
                                        disabled={(message.regenerationCount || 0) >= 2}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={(message.regenerationCount || 0) >= 2 ? "Max regenerations reached (2/2)" : "Regenerate response"}
                                    >
                                        <RotateCw className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
