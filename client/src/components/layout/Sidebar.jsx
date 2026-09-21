import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import ConversationList from '../chat/ConversationList';
import CallHistoryList from '../chat/CallHistoryList';
import ContactSearch from '../contacts/ContactSearch';
import ContactRequests from '../contacts/ContactRequests';
import ContactsList from '../contacts/ContactsList';
import NewGroupModal from '../chat/NewGroupModal';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useRandomChatStore } from '../../store/randomChatStore';
import { startRandomChat } from '../../random/randomChatClient';
import { createConversation } from '../../api/chat.api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Circles & Groups' },
  { id: 'calls', label: 'Calls' },
];

export default function Sidebar({ onSelectConversation }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const conversations = useChatStore((s) => s.conversations);
  const randomSessionActive = useRandomChatStore((s) => s.sessionActive);
  const randomPhase = useRandomChatStore((s) => s.phase);
  const randomPartner = useRandomChatStore((s) => s.partner);
  const randomMessages = useRandomChatStore((s) => s.messages);
  const showRandomChat = useRandomChatStore((s) => s.show);
  const [tab, setTab] = useState('chats');
  const [filter, setFilter] = useState('all');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0);

  const unreadCount = conversations.filter((c) => c.lastMessage && c.lastMessage.senderId !== user?.id).length;

  const startDirectChat = async (contact) => {
    const conversation = await createConversation({ type: 'direct', participantIds: [contact.id] });
    upsertConversation(conversation);
    setTab('chats');
    onSelectConversation(conversation.id);
  };

  return (
    <aside className="w-80 shrink-0 border-r border-line flex flex-col h-full bg-paper">
      <div className="p-4 flex items-center justify-between border-b border-line">
        <Link to="/profile" className="flex items-center gap-2 min-w-0">
          <Avatar user={user} size="sm" />
          <span className="font-display font-semibold truncate">{user?.name}</span>
        </Link>
        <Button variant="outline" className="text-xs px-2 py-1" onClick={() => setGroupModalOpen(true)}>
          + Group
        </Button>
      </div>

      <div className="flex gap-1 p-2 border-b border-line">
        <button
          className={`flex-1 py-1.5 rounded-full text-sm font-semibold ${tab === 'chats' ? 'bg-accent-soft text-accent' : 'text-ink-soft'}`}
          onClick={() => setTab('chats')}
        >
          Chats
        </button>
        <button
          className={`flex-1 py-1.5 rounded-full text-sm font-semibold ${tab === 'contacts' ? 'bg-accent-soft text-accent' : 'text-ink-soft'}`}
          onClick={() => setTab('contacts')}
        >
          Contacts
        </button>
      </div>

      {tab === 'chats' && (
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
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {tab === 'chats' ? (
          filter === 'calls' ? (
            <CallHistoryList onSelectConversation={onSelectConversation} />
          ) : (
            <ConversationList onSelect={onSelectConversation} filter={filter} />
          )
        ) : (
          <>
            <ContactSearch />
            <ContactRequests onAccepted={() => setContactsRefreshKey((k) => k + 1)} />
            <ContactsList onStartChat={startDirectChat} refreshKey={contactsRefreshKey} />
          </>
        )}
      </div>

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
