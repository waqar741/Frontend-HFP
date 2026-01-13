import { AppShell } from '@/components/layout/AppShell';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';

export default function Home() {
  return (
    <AppShell>
      <div className="flex h-full flex-col bg-hfp-navy">
        {/* Header with Node Selector */}
        <ChatHeader />

        {/* Chat Area - Takes available space */}
        <ChatArea />

        {/* Input Area - Fixed at bottom */}
        <ChatInput />
      </div>
    </AppShell>
  );
}
