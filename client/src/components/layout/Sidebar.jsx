import { useState } from 'react';
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
  { id: 'groups', label: 'Groups' },
  { id: 'calls', label: 'Calls' },
];

export default function Sidebar({ onSelectConversation, hiddenOnMobile }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const conversations = useChatStore((s) => s.conversations);
  const randomSessionActive = useRandomChatStore((s) => s.sessionActive);
  const showRandomChat = useRandomChatStore((s) => s.show);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [randomStarting, setRandomStarting] = useState(false);

  const unreadCount = conversations.filter((c) => c.lastMessage && c.lastMessage.senderId !== user?.id).length;

  const startOrShowRandom = async () => {
    if (randomSessionActive) {
      showRandomChat();
      return;
    }
    setRandomStarting(true);
    try {
      await startRandomChat(accessToken);
    } finally {
      setRandomStarting(false);
    }
  };

  return (
    <aside
      className={`${hiddenOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-line flex-col h-full bg-paper`}
    >
      <div className="p-4 flex items-center justify-between">
        <p className="font-display font-bold text-2xl">Messages</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setGroupModalOpen(true)}
            title="New group"
            className="h-9 w-9 rounded-full border border-line flex items-center justify-center text-ink-soft hover:bg-paper-soft"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" />
              <path strokeLinecap="round" d="M17 8v4M15 10h4" />
            </svg>
          </button>
          <button
            onClick={() => setChatModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent text-white text-sm font-semibold px-4 py-2 hover:brightness-105 transition-[filter]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.5 20.5H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v9.5"
              />
              <path strokeLinecap="round" d="M18 15.5v6M15 18.5h6" />
            </svg>
            New chat
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap ${
                filter === f.id ? 'bg-paper-soft text-ink' : 'text-ink-soft hover:bg-paper-soft'
              }`}
            >
              {f.label}
            </button>
          ))}
          {unreadCount > 0 && (
            <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white whitespace-nowrap">
              {unreadCount} UNREAD
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filter === 'calls' ? (
          <CallHistoryList onSelectConversation={onSelectConversation} />
        ) : (
          <ConversationList onSelect={onSelectConversation} filter={filter} search={search} />
        )}
      </div>

      <button
        onClick={startOrShowRandom}
        disabled={randomStarting}
        className="flex items-center gap-3 p-4 border-t border-line hover:bg-paper-soft text-left"
      >
        <span className="h-10 w-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m17 3 4 4-4 4M21 7H9a4 4 0 0 0-4 4v1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m7 21-4-4 4-4M3 17h12a4 4 0 0 0 4-4v-1" />
          </svg>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold">Random chat</span>
          <span className="block text-xs text-ink-soft truncate">Meet someone new</span>
        </span>
        <span className="shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-line">
          {randomSessionActive ? 'Resume' : randomStarting ? 'Starting...' : 'Start'}
        </span>
      </button>

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
