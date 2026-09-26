import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { usePresenceStore } from '../store/presenceStore';
import { useAuthStore } from '../store/authStore';
import { fetchConversations } from '../api/chat.api';
import { useSocket } from '../hooks/useSocket';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import ContactDossier from '../components/chat/ContactDossier';
import RandomChatWidget from '../components/chat/RandomChatWidget';
import CreatePostModal from '../components/social/CreatePostModal';

export default function ChatPage() {
  useSocket();

  const myId = useAuthStore((s) => s.user?.id);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const seedFromUsers = usePresenceStore((s) => s.seedFromUsers);
  const [infoOpen, setInfoOpen] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

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
  const otherUser =
    activeConversation && activeConversation.type === 'direct'
      ? activeConversation.participants.find((p) => p.id !== myId)
      : null;

  return (
    <div className="h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && <CreatePostModal onClose={() => setComposerOpen(false)} />}

      <HomeTopBar onCreate={() => setComposerOpen(true)} />

      <FeedSidebar />

      <div className="flex-1 flex min-h-0 lg:pl-64">
        <div className="flex-1 flex min-h-0 min-w-0">
          <Sidebar onSelectConversation={setActiveConversation} hiddenOnMobile={Boolean(activeConversation)} />

          <main className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
            {activeConversation ? (
              <>
                <TopBar
                  conversation={activeConversation}
                  onBack={() => setActiveConversation(null)}
                  onToggleInfo={() => setInfoOpen((o) => !o)}
                  infoOpen={infoOpen}
                />
                <MessageList
                  conversationId={activeConversation.id}
                  isGroup={activeConversation.type === 'group'}
                  otherUser={otherUser}
                />
                <TypingIndicator conversationId={activeConversation.id} />
                <MessageInput
                  conversationId={activeConversation.id}
                  disabled={activeConversation.messagingDisabled}
                  placeholder={otherUser ? `Message ${otherUser.name}...` : 'Write something...'}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink-soft">
                <p className="font-display text-lg">Pick a chat, or start a new one.</p>
              </div>
            )}
          </main>

          {activeConversation && infoOpen && <ContactDossier conversation={activeConversation} />}
        </div>
      </div>

      <RandomChatWidget />
      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );
}
