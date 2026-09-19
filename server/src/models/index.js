import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { OtpCode } from './OtpCode.js';
import { ContactRequest } from './ContactRequest.js';
import { Conversation } from './Conversation.js';
import { ConversationParticipant } from './ConversationParticipant.js';
import { Message } from './Message.js';
import { MessageStatus } from './MessageStatus.js';
import { FriendRequest } from './FriendRequest.js';
import { Follow } from './Follow.js';
import { Post } from './Post.js';
import { Like } from './Like.js';
import { Comment } from './Comment.js';
import { Notification } from './Notification.js';
import { Story } from './Story.js';
import { StoryView } from './StoryView.js';
import { CallLog } from './CallLog.js';

// Conversation <-> User through ConversationParticipant
Conversation.belongsToMany(User, {
  through: ConversationParticipant,
  foreignKey: 'conversationId',
  otherKey: 'userId',
  as: 'participants',
});
User.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: 'userId',
  otherKey: 'conversationId',
  as: 'conversations',
});
ConversationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participantRows' });

// Messages
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

Message.hasMany(MessageStatus, { foreignKey: 'messageId', as: 'statuses' });
MessageStatus.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });
MessageStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Contact requests
ContactRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
ContactRequest.belongsTo(User, { foreignKey: 'addresseeId', as: 'addressee' });

// Friends (separate graph from chat contacts)
FriendRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
FriendRequest.belongsTo(User, { foreignKey: 'addresseeId', as: 'addressee' });

// Follows (one-way, no acceptance)
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

// Posts / likes / comments
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Notifications
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Stories (ephemeral, 24h)
User.hasMany(Story, { foreignKey: 'authorId', as: 'stories' });
Story.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Story.hasMany(StoryView, { foreignKey: 'storyId', as: 'views' });
StoryView.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
StoryView.belongsTo(User, { foreignKey: 'viewerId', as: 'viewer' });

// Call history
CallLog.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
CallLog.belongsTo(User, { foreignKey: 'calleeId', as: 'callee' });
CallLog.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

export {
  sequelize,
  User,
  OtpCode,
  ContactRequest,
  Conversation,
  ConversationParticipant,
  Message,
  MessageStatus,
  FriendRequest,
  Follow,
  Post,
  Like,
  Comment,
  Notification,
  Story,
  StoryView,
  CallLog,
};
