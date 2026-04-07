'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, UserPlus, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// --- Create/Edit User Dialog ---
interface UserFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
    editUser?: AdminUser | null;
}

export function UserFormDialog({ open, onClose, onSubmit, editUser }: UserFormDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!editUser;

    useEffect(() => {
        if (editUser) {
            setName(editUser.name);
            setEmail(editUser.email);
            setRole(editUser.role as 'user' | 'admin');
            setPassword('');
        } else {
            setName('');
            setEmail('');
            setPassword('');
            setRole('user');
        }
        setError('');
        setShowPassword(false);
    }, [editUser, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await onSubmit({ name, email, password, role });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px] bg-zinc-950 border-zinc-800/60 text-zinc-100 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-white">
                        {isEditing ? 'Edit User' : 'Create New User'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {isEditing
                            ? 'Update user details. Leave password blank to keep it unchanged.'
                            : 'Add a new user to the platform.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-xl bg-red-950/50 border border-red-900/50 p-3 text-sm font-medium text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">Full Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            className="h-11 bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-primary/50 focus-visible:ring-primary/30"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            className="h-11 bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-primary/50 focus-visible:ring-primary/30"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">
                            Password {isEditing && <span className="text-zinc-500 font-normal">(leave blank to keep current)</span>}
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isEditing ? '••••••••' : 'Min. 6 characters'}
                                required={!isEditing}
                                minLength={password.length > 0 ? 6 : undefined}
                                className="h-11 bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 rounded-xl pr-10 focus:border-primary/50 focus-visible:ring-primary/30"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">Role</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                                    role === 'user'
                                        ? 'bg-zinc-800 border-zinc-600 text-white'
                                        : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                }`}
                            >
                                User
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                                    role === 'admin'
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                }`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl hover:from-primary/90 hover:to-blue-600/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? 'Saving…' : 'Creating…'}
                                </>
                            ) : (
                                <>
                                    {isEditing ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    {isEditing ? 'Save Changes' : 'Create User'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Delete Confirmation Dialog ---
interface DeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    userName: string;
}

export function DeleteUserDialog({ open, onClose, onConfirm, userName }: DeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch {
            // error handled by parent
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] bg-zinc-950 border-zinc-800/60 text-zinc-100 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-white">Delete User</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Are you sure you want to delete <span className="text-zinc-200 font-medium">{userName}</span>?
                        This will also delete all their chat sessions. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting…
                            </>
                        ) : (
                            'Delete User'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Reset Password Dialog ---
interface ResetPasswordDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (newPassword: string) => Promise<void>;
    userName: string;
}

export function ResetPasswordDialog({ open, onClose, onSubmit, userName }: ResetPasswordDialogProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setPassword('');
        setError('');
        setShowPassword(false);
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await onSubmit(password);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] bg-zinc-950 border-zinc-800/60 text-zinc-100 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-white">Reset Password</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Set a new password for <span className="text-zinc-200 font-medium">{userName}</span>.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-xl bg-red-950/50 border border-red-900/50 p-3 text-sm font-medium text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300 ml-1">New Password</label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                                className="h-11 bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 rounded-xl pr-10 focus:border-primary/50 focus-visible:ring-primary/30"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98] disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting…
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
