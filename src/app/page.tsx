import { AppShell } from '@/components/layout/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatHeader } from '@/components/chat/ChatHeader';

export default function Home() {
  return (
    <AppShell>
      <div className="flex h-full flex-col bg-background">
        {/* Header with Node Selector */}
        <ChatHeader />

        {/* Chat Interface (Handles Logic for Centering) */}
        <ChatInterface />
      </div>
    </AppShell>
  );
}
