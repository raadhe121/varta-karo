import { useState } from 'react';
import { View, Text, Image, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Avatar from '../common/Avatar';
import { toggleLike, fetchComments, addComment, deletePost } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import { colors, radius } from '../../config/theme';
import { API_ORIGIN } from '../../config/env';

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const VISIBILITY_LABEL = { public: 'Public', friends: 'Friends', only_me: 'Only me' };

function imgUri(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

function PostVideo({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={style} contentFit="cover" nativeControls />;
}

export default function PostCard({ post, onDeleted }) {
  const navigation = useNavigation();
  const myId = useAuthStore((s) => s.user?.id);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleLike = async () => {
    const res = await toggleLike(post.id);
    setLiked(res.liked);
    setLikeCount(res.likeCount);
  };

  const openComments = async () => {
    setCommentsOpen((open) => !open);
    if (!comments) setComments(await fetchComments(post.id));
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const comment = await addComment(post.id, commentText.trim());
    setComments((prev) => [...(prev || []), comment]);
    setCommentCount((c) => c + 1);
    setCommentText('');
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onDeleted?.(post.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable style={styles.authorRow} onPress={() => navigation.navigate('Profile', { userId: post.author.id })}>
          <Avatar user={post.author} size="sm" />
          <View>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.meta}>
              {timeAgo(post.createdAt)} · {VISIBILITY_LABEL[post.visibility]}
            </Text>
          </View>
        </Pressable>
        {post.author.id === myId && (
          <Pressable onPress={handleDelete}>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        )}
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
      {post.imageUrl &&
        (post.mediaType === 'video' ? (
          <PostVideo uri={imgUri(post.imageUrl)} style={styles.image} />
        ) : (
          <Image source={{ uri: imgUri(post.imageUrl) }} style={styles.image} />
        ))}

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            {liked ? '♥' : '♡'} {likeCount > 0 ? likeCount : ''}
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={openComments}>
          <Text style={styles.actionText}>💬 {commentCount > 0 ? commentCount : ''}</Text>
        </Pressable>
      </View>

      {commentsOpen && (
        <View style={styles.commentsBlock}>
          {comments?.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Avatar user={c.author} size="sm" />
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>{c.author.name}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={colors.inkSoft}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={submitComment}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 14, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 11, color: colors.inkSoft },
  delete: { fontSize: 12, color: colors.inkSoft },
  content: { fontSize: 14, color: colors.ink, marginBottom: 10, lineHeight: 20 },
  image: { width: '100%', height: 220, borderRadius: radius.md, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  actionButton: {},
  actionText: { fontSize: 14, color: colors.inkSoft },
  actionTextActive: { color: colors.accent, fontWeight: '700' },
  commentsBlock: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 8 },
  commentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  commentBubble: { backgroundColor: colors.paperSoft, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6, flex: 1 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: colors.ink },
  commentText: { fontSize: 13, color: colors.ink },
  commentInputRow: { marginTop: 4 },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
});
