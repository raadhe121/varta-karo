import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import ConversationList from '../chat/ConversationList';
import CallHistoryList from '../chat/CallHistoryList';
import NewGroupModal from '../chat/NewGroupModal';
import NewChatModal from '../chat/NewChatModal';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useRandomChatStore } from '../../store/randomChatStore';
import { startRandomChat } from '../../random/randomChatClient';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Circles & Groups' },
  { id: 'calls', label: 'Calls' },
];

export default function Sidebar({ onSelectConversation, hiddenOnMobile }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const conversations = useChatStore((s) => s.conversations);
  const randomSessionActive = useRandomChatStore((s) => s.sessionActive);
  const randomPhase = useRandomChatStore((s) => s.phase);
  const randomPartner = useRandomChatStore((s) => s.partner);
  const randomMessages = useRandomChatStore((s) => s.messages);
  const showRandomChat = useRandomChatStore((s) => s.show);
  const [filter, setFilter] = useState('all');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const unreadCount = conversations.filter((c) => c.lastMessage && c.lastMessage.senderId !== user?.id).length;

  return (
    <aside
      className={`${hiddenOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-line flex-col h-full bg-paper`}
    >
      <div className="p-4 flex items-center justify-between border-b border-line">
        <Link to="/profile" className="flex items-center gap-2 min-w-0">
          <Avatar user={user} size="sm" />
          <span className="font-display font-semibold truncate">{user?.name}</span>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" className="text-xs px-2 py-1" onClick={() => setChatModalOpen(true)}>
            + Chat
          </Button>
          <Button variant="outline" className="text-xs px-2 py-1" onClick={() => setGroupModalOpen(true)}>
            + Group
          </Button>
        </div>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => (randomSessionActive ? showRandomChat() : startRandomChat(accessToken))}
          className="w-full mb-3 py-2 rounded-lg border border-accent text-accent text-sm font-semibold hover:bg-accent-soft transition-colors"
        >
          New Random Chat
        </button>

        {randomSessionActive && (
          <button
            onClick={showRandomChat}
            className="w-full flex items-center gap-3 px-2 py-2 mb-3 rounded-xl hover:bg-paper-soft text-left"
          >
            <Avatar user={{ name: randomPartner?.isGuest ? randomPartner.name : 'Stranger' }} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">Anonymous</p>
              <p className="text-xs text-ink-soft truncate">
                {randomPhase === 'waiting'
                  ? 'Finding someone...'
                  : randomMessages.length > 0
                    ? randomMessages[randomMessages.length - 1].text
                    : 'Say hello 👋'}
              </p>
            </div>
          </button>
        )}

        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-semibold">Conversations</p>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-white">{unreadCount} UNREAD</span>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${
                filter === f.id ? 'bg-accent text-white' : 'bg-paper-soft text-ink-soft hover:bg-line'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filter === 'calls' ? (
          <CallHistoryList onSelectConversation={onSelectConversation} />
        ) : (
          <ConversationList onSelect={onSelectConversation} filter={filter} />
        )}
      </div>

      <NewChatModal
        open={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        onCreated={(conversation) => {
          upsertConversation(conversation);
          onSelectConversation(conversation.id);
        }}
      />

      <NewGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onCreated={(conversation) => {
          upsertConversation(conversation);
          onSelectConversation(conversation.id);
        }}
      />
    </aside>
  );
}
