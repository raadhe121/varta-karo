import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { usePresenceStore } from '../store/presenceStore';
import { fetchConversations } from '../api/chat.api';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import AppNav from '../components/layout/AppNav';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import ContactDossier from '../components/chat/ContactDossier';
import RandomChatWidget from '../components/chat/RandomChatWidget';

export default function ChatPage() {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const seedFromUsers = usePresenceStore((s) => s.seedFromUsers);

  useEffect(() => {
    fetchConversations().then((data) => {
      setConversations(data);
      seedFromUsers(data.flatMap((c) => c.participants));
      if (!activeConversationId && data.length > 0) {
        setActiveConversation(data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex min-h-0">
        <Sidebar onSelectConversation={setActiveConversation} />

        <main className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <>
              <TopBar conversation={activeConversation} />
              <MessageList conversationId={activeConversation.id} isGroup={activeConversation.type === 'group'} />
              <TypingIndicator conversationId={activeConversation.id} />
              <MessageInput conversationId={activeConversation.id} disabled={activeConversation.messagingDisabled} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-soft">
              <p className="font-display text-lg">Pick a chat, or start a new one.</p>
            </div>
          )}
        </main>

        {activeConversation && <ContactDossier conversation={activeConversation} />}
      </div>

      <RandomChatWidget />
    </div>
  );
}
