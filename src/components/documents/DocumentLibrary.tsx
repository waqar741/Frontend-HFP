'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    FileText, Trash2, Upload, X, CheckCircle, AlertCircle, Loader2,
    BookOpen, Clock, Hash, FileSearch, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentStore } from '@/hooks/useDocumentStore';
import type { DocumentRecord } from '@/types/document';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface DocumentLibraryProps {
    open: boolean;
    onClose: () => void;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: DocumentRecord['processingStatus'] }) {
    if (status === 'ready') return (
        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-2.5 w-2.5" /> Ready
        </span>
    );
    if (status === 'pending') return (
        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> Processing
        </span>
    );
    return (
        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <AlertCircle className="h-2.5 w-2.5" /> Error
        </span>
    );
}

export function DocumentLibrary({ open, onClose }: DocumentLibraryProps) {
    const { documents, isUploading, uploadProgress, uploadDocument, deleteDocument } = useDocumentStore();
    const [dragOver, setDragOver] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) useDocumentStore.getState().loadDocuments();
    }, [open]);

    const showToast = (text: string, ok = true) => {
        setToastMsg({ text, ok });
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type === 'application/pdf');
        if (arr.length === 0) {
            showToast('Only PDF files are supported.', false);
            return;
        }
        for (const file of arr) {
            const doc = await uploadDocument(file);
            if (doc) {
                showToast(doc.processingStatus === 'ready'
                    ? `"${doc.originalName}" already in library — reused instantly!`
                    : `"${doc.originalName}" uploaded successfully.`);
            } else {
                showToast(`Failed to upload "${file.name}".`, false);
            }
        }
    }, [uploadDocument]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
        e.target.value = '';
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteDocument(deleteTarget.id);
        showToast(`"${deleteTarget.originalName}" removed.`);
        setDeleteTarget(null);
    };

    if (!open) return null;

    return (
        <>
            {/* Delete Confirm Dialog — z-200 so it renders ABOVE the panel backdrop */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm z-[200]">
                    <DialogHeader>
                        <DialogTitle>Remove Document?</DialogTitle>
                        <DialogDescription>
                            &quot;{deleteTarget?.originalName}&quot; will be removed from the library.
                            Previous chat references to @{deleteTarget?.name} will remain in history.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toast */}
            {toastMsg && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl text-sm font-medium transition-all duration-300 ${toastMsg.ok ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'
                    }`}>
                    {toastMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {toastMsg.text}
                </div>
            )}

            {/* Slide-in Panel */}
            <div className="fixed inset-0 z-[100] flex items-end sm:items-stretch justify-end">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                {/* Panel */}
                <div className="relative z-10 flex flex-col w-full max-w-md h-[90vh] sm:h-full bg-background border-l border-border shadow-2xl animate-slide-in-right">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 border border-primary/20">
                                <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground text-sm">Document Library</h2>
                                <p className="text-[11px] text-muted-foreground">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Upload Zone */}
                    <div className="px-4 py-3 border-b border-border shrink-0">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 cursor-pointer transition-all duration-200 ${dragOver
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50 hover:bg-muted/40'
                                } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                                    <p className="text-sm font-medium text-foreground">Uploading… {uploadProgress}%</p>
                                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mt-1">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-7 w-7 text-muted-foreground" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">Drop PDFs here or click to upload</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Duplicates are detected instantly — zero reprocessing</p>
                                    </div>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={handleFileInput} />
                        </div>
                    </div>

                    {/* Document List */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4 space-y-2">
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                    <FileSearch className="h-10 w-10 opacity-30" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium">No documents yet</p>
                                        <p className="text-xs mt-1">Upload a PDF to start building your knowledge library.</p>
                                    </div>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0 mt-0.5">
                                            <FileText className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-foreground truncate max-w-[180px]" title={doc.originalName}>
                                                    {doc.originalName}
                                                </p>
                                                <StatusBadge status={doc.processingStatus} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    <code className="font-mono text-primary/80">@{doc.name}</code>
                                                </span>
                                                <span>{formatBytes(doc.size)}</span>
                                                {doc.pageCount > 0 && <span>{doc.pageCount}p</span>}
                                                {doc.hasImages && (
                                                    <span className="flex items-center gap-0.5 text-blue-500">
                                                        <ImageIcon className="h-2.5 w-2.5" />
                                                        {doc.imageCount || 0} img
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/70">
                                                <Clock className="h-2.5 w-2.5" />
                                                {new Date(doc.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            {doc.processingStatus === 'error' && doc.errorMessage && (
                                                <p className="mt-1 text-[11px] text-destructive">{doc.errorMessage}</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                            onClick={() => setDeleteTarget(doc)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer hint */}
                    <div className="px-4 py-3 border-t border-border shrink-0 bg-muted/20">
                        <p className="text-[11px] text-muted-foreground text-center">
                            Type <code className="bg-muted px-1 rounded text-primary">@</code> in chat to reference a document by its tag name
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
