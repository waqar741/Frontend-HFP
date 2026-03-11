import { AppShell } from '@/components/layout/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { AuthModal } from '@/components/auth/AuthModal';

export default function ChatPage() {
  return (
    <AppShell>
      <div className="flex h-full flex-col bg-background">
        {/* Header with Node Selector */}
        <ChatHeader />

        {/* Chat Interface (Handles Logic for Centering) */}
        <ChatInterface />

        {/* Auth Modal (globally controlled via authStore) */}
        <AuthModal />
      </div>
    </AppShell>
  );
}
