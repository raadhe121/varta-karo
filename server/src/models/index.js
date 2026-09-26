import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { OtpCode } from './OtpCode.js';
import { Conversation } from './Conversation.js';
import { ConversationParticipant } from './ConversationParticipant.js';
import { Message } from './Message.js';
import { MessageStatus } from './MessageStatus.js';
import { Follow } from './Follow.js';
import { FollowRequest } from './FollowRequest.js';
import { Block } from './Block.js';
import { Post } from './Post.js';
import { Like } from './Like.js';
import { Save } from './Save.js';
import { Share } from './Share.js';
import { Comment } from './Comment.js';
import { Notification } from './Notification.js';
import { Story } from './Story.js';
import { StoryView } from './StoryView.js';
import { CallLog } from './CallLog.js';
import { Community } from './Community.js';
import { CommunityMember } from './CommunityMember.js';
import { CommunityPost } from './CommunityPost.js';
import { Collection } from './Collection.js';
import { Highlight } from './Highlight.js';
import { HighlightItem } from './HighlightItem.js';

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

// Follows (one-way; a mutual pair — each follows the other — is what the
// rest of the app treats as "friends": chat eligibility, feed/story
// visibility, etc. See services/visibility.service.js)
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

// Pending follow asks against a private account -- see FollowRequest.js.
FollowRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
FollowRequest.belongsTo(User, { foreignKey: 'targetId', as: 'target' });

// Blocks (one-way; either side blocking the other severs the relationship —
// see services/block.service.js)
Block.belongsTo(User, { foreignKey: 'blockerId', as: 'blocker' });
Block.belongsTo(User, { foreignKey: 'blockedId', as: 'blocked' });

// Posts / likes / comments
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

Post.hasMany(Save, { foreignKey: 'postId', as: 'saves' });
Save.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Save.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Save.belongsTo(Collection, { foreignKey: 'collectionId', as: 'collection' });

// Saved-post collections
User.hasMany(Collection, { foreignKey: 'ownerId', as: 'collections' });
Collection.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Collection.hasMany(Save, { foreignKey: 'collectionId', as: 'saves' });

// Profile highlights (permanent copies of story media)
User.hasMany(Highlight, { foreignKey: 'ownerId', as: 'highlights' });
Highlight.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Highlight.hasMany(HighlightItem, { foreignKey: 'highlightId', as: 'items' });
HighlightItem.belongsTo(Highlight, { foreignKey: 'highlightId', as: 'highlight' });

Post.hasMany(Share, { foreignKey: 'postId', as: 'shares' });
Share.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Share.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

// Communities
Community.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
Community.hasMany(CommunityMember, { foreignKey: 'communityId', as: 'members' });
CommunityMember.belongsTo(Community, { foreignKey: 'communityId', as: 'community' });
CommunityMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Community.hasMany(CommunityPost, { foreignKey: 'communityId', as: 'posts' });
CommunityPost.belongsTo(Community, { foreignKey: 'communityId', as: 'community' });
CommunityPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

export {
  sequelize,
  User,
  OtpCode,
  Conversation,
  ConversationParticipant,
  Message,
  MessageStatus,
  Follow,
  FollowRequest,
  Block,
  Post,
  Like,
  Save,
  Share,
  Comment,
  Notification,
  Story,
  StoryView,
  CallLog,
  Community,
  CommunityMember,
  CommunityPost,
  Collection,
  Highlight,
  HighlightItem,
};
