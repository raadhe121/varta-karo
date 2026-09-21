import { useRef, useState } from 'react';
import { createPost } from '../../api/posts.api';
import { uploadMedia } from '../../api/chat.api';
import Button from '../common/Button';
import { resolveMediaUrl } from '../../utils/media';

export default function PostComposer({ onCreated }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [imageUrl, setImageUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setImageUrl(uploaded.url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    try {
      const post = await createPost({ content: content.trim() || undefined, imageUrl, mediaType, visibility });
      onCreated(post);
      setContent('');
      setImageUrl(null);
      setMediaType(null);
      setVisibility('public');
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-paper p-4 space-y-3 shadow-md shadow-ink/5">
      <textarea
        className="input"
        rows={3}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {imageUrl && (
        <div className="relative inline-block">
          {mediaType === 'video' ? (
            <video src={resolveMediaUrl(imageUrl)} controls className="max-h-48 rounded-xl" />
          ) : (
            <img src={resolveMediaUrl(imageUrl)} alt="attachment" className="max-h-48 rounded-xl" />
          )}
          <button
            type="button"
            onClick={() => {
              setImageUrl(null);
              setMediaType(null);
            }}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-ink/70 text-paper text-sm"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-9 w-9 rounded-xl border border-line flex items-center justify-center hover:bg-paper-soft"
            title="Add a photo"
          >
            {uploading ? '...' : '📷'}
          </button>
          <select
            className="text-sm rounded-lg border border-line bg-paper px-2 py-1.5"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="only_me">Only me</option>
          </select>
        </div>
        <Button type="submit" disabled={posting || (!content.trim() && !imageUrl)}>
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
