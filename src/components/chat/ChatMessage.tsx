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
                'group flex w-full gap-3 px-4 md:px-8 py-4 transition-colors',
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
                                    'relative rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm transition-all',
                                    'bg-[#0ea5e9] text-white rounded-tr-sm'
                                )}
                            >
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full min-h-[80px] resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleCancelEdit}
                                                className="h-8 gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                className="h-8 gap-1 bg-blue-600 hover:bg-blue-500"
                                            >
                                                <Check className="h-3 w-3" />
                                                Save & Submit
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                )}
                            </div>

                            {/* Action Buttons - User Messages - Always Visible */}
                            {!isEditing && (
                                <div className="flex gap-1 mt-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        title="Copy message"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
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
                        <div className="flex items-center justify-between w-full mt-2 gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Compact Model Badge */}
                                <div className="flex items-center gap-1.5 bg-secondary/50 border border-border/50 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary/80 transition-colors">
                                    <span className="font-bold text-primary">{message.model || modelName || message.modelName || 'Unknown Model'}</span>

                                    {message.stats && (
                                        <>
                                            <span className="w-0.5 h-3 bg-border/80" />
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-80">
                                                {message.stats.timeMs !== undefined && (
                                                    <span>{(message.stats.timeMs / 1000).toFixed(1)}s</span>
                                                )}
                                                {message.stats.tokens !== undefined && (
                                                    <span>{message.stats.tokens}t</span>
                                                )}
                                                {message.stats.tokensPerSec !== undefined && (
                                                    <span>{message.stats.tokensPerSec.toFixed(0)} t/s</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full"
                                    title="Copy response"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {isLast && onRegenerate && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={onRegenerate}
                                        disabled={(message.regenerationCount || 0) >= 2}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
