'use client';

import { useState } from 'react';
import { Pencil, Copy, Trash2, RotateCw, Check, X } from 'lucide-react';
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
                'group flex w-full gap-3 px-4 py-3 transition-colors',
                isUser ? 'justify-end' : 'justify-start',
                isHovered && 'bg-accent/5'
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
                <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
                    {/* Message Bubble */}
                    <div
                        className={cn(
                            'relative rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm transition-all',
                            isUser
                                ? 'bg-[#0ea5e9] text-white rounded-tr-sm'
                                : 'bg-transparent text-foreground'
                        )}
                    >
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full min-h-[80px] resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <>
                                {isUser ? (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm prose-invert max-w-none leading-relaxed dark:prose-p:text-foreground dark:prose-headings:text-foreground prose-code:text-primary">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Buttons - User Messages */}
                    {isUser && !isEditing && (isHovered || isLast) && (
                        <div className="flex gap-1 mt-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsEditing(true)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Edit message"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
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

                    {/* Metadata Footer - AI Messages */}
                    {!isUser && !isEditing && (
                        <div className="flex items-center justify-between w-full mt-2 gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {modelName && (
                                    <div className="bg-muted px-2 py-1 rounded text-muted-foreground flex items-center gap-2 max-w-[200px]">
                                        <span className="truncate font-mono text-[10px]">{modelName}</span>
                                    </div>
                                )}
                                {message.stats && (
                                    <>
                                        {message.stats.tokens !== undefined && (
                                            <span className="text-[10px] font-mono">{message.stats.tokens} tokens</span>
                                        )}
                                        {message.stats.timeMs !== undefined && (
                                            <span className="text-[10px] font-mono">{(message.stats.timeMs / 1000).toFixed(2)}s</span>
                                        )}
                                        {message.stats.tokensPerSec !== undefined && (
                                            <span className="text-[10px] font-mono">{message.stats.tokensPerSec.toFixed(2)} tokens/s</span>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    title="Copy response"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {isLast && onRegenerate && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={onRegenerate}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        title="Regenerate response"
                                    >
                                        <RotateCw className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
