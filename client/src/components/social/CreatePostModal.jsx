import { useMemo, useRef, useState } from 'react';
import { createPost } from '../../api/posts.api';
import { uploadMedia } from '../../api/chat.api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'mono', label: 'Mono', css: 'grayscale(1) contrast(1.05)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.35) saturate(1.3) contrast(1.05)' },
  { id: 'cool', label: 'Cool', css: 'hue-rotate(180deg) saturate(1.15)' },
  { id: 'fade', label: 'Fade', css: 'contrast(0.9) brightness(1.05) saturate(0.8)' },
  { id: 'punch', label: 'Punch', css: 'contrast(1.25) saturate(1.4)' },
];

const MAX_DIMENSION = 1440;

// Bakes the chosen crop + CSS filter into real pixels via canvas, so every
// viewer sees the edited version -- not just a CSS overlay on our own
// preview. Video isn't re-encoded client-side, so it skips this untouched.
function renderImageToBlob(imgEl, { aspect, filterCss }) {
  const naturalW = imgEl.naturalWidth;
  const naturalH = imgEl.naturalHeight;

  let sx = 0;
  let sy = 0;
  let sw = naturalW;
  let sh = naturalH;
  if (aspect === 'square') {
    const side = Math.min(naturalW, naturalH);
    sx = (naturalW - side) / 2;
    sy = (naturalH - side) / 2;
    sw = side;
    sh = side;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(sw, sh));
  const outW = Math.round(sw * scale);
  const outH = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.filter = filterCss;
  ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outW, outH);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

export default function CreatePostModal({ onClose, onCreated }) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState('select'); // select | edit | share
  const [file, setFile] = useState(null);
  // Set instead of `file` when 2+ items are picked -- a carousel post skips
  // the single-image crop/filter editor (too much UI for N images at once)
  // and goes straight to captioning, uploading each item as-is.
  const [files, setFiles] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [aspect, setAspect] = useState('original');
  const [filterId, setFilterId] = useState('original');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const filter = useMemo(() => FILTERS.find((f) => f.id === filterId) || FILTERS[0], [filterId]);

  const pickFiles = (pickedList) => {
    const picked = Array.from(pickedList || []);
    if (picked.length === 0) return;
    if (picked.length === 1) {
      setFile(picked[0]);
      setFiles(null);
      setPreviewUrl(URL.createObjectURL(picked[0]));
      setMediaType(picked[0].type.startsWith('video/') ? 'video' : 'image');
      setStep('edit');
      return;
    }
    setFile(null);
    setFiles(picked.slice(0, 10));
    setCarouselIndex(0);
    setStep('share');
  };

  const handleInputChange = (e) => {
    const picked = e.target.files;
    pickFiles(picked);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFiles(e.dataTransfer.files);
  };

  const handleShare = async () => {
    setBusy(true);
    setError('');
    try {
      if (files) {
        const uploaded = await Promise.all(
          files.map(async (f) => {
            const res = await uploadMedia(f);
            return { url: res.url, mediaType: f.type.startsWith('video/') ? 'video' : 'image' };
          })
        );
        const post = await createPost({ content: caption.trim() || undefined, media: uploaded, visibility });
        window.dispatchEvent(new CustomEvent('post:created', { detail: post }));
        onCreated?.(post);
        onClose();
        return;
      }

      let uploadFile = file;
      if (mediaType === 'image' && imgRef.current) {
        const blob = await renderImageToBlob(imgRef.current, { aspect, filterCss: filter.css });
        uploadFile = new File([blob], 'post.jpg', { type: 'image/jpeg' });
      }

      const uploaded = await uploadMedia(uploadFile);
      const post = await createPost({
        content: caption.trim() || undefined,
        imageUrl: uploaded.url,
        mediaType,
        visibility,
      });
      window.dispatchEvent(new CustomEvent('post:created', { detail: post }));
      onCreated?.(post);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share this post');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-paper rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          {step !== 'select' ? (
            <button
              onClick={() => setStep(step === 'share' && !files ? 'edit' : 'select')}
              className="text-ink-soft hover:text-ink text-sm font-semibold"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <p className="font-semibold text-sm">Create new post</p>
          {step === 'edit' && (
            <button onClick={() => setStep('share')} className="text-accent font-semibold text-sm">
              Next
            </button>
          )}
          {step === 'share' && (
            <button onClick={handleShare} disabled={busy} className="text-accent font-semibold text-sm disabled:opacity-40">
              {busy ? 'Sharing...' : 'Share'}
            </button>
          )}
          {step === 'select' && <button onClick={onClose} className="text-ink-soft text-xl leading-none">&times;</button>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'select' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`h-[420px] flex flex-col items-center justify-center gap-4 m-4 rounded-xl border-2 border-dashed transition-colors ${
                dragging ? 'border-accent bg-accent-soft' : 'border-line'
              }`}
            >
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-ink-soft">
                <rect x="2" y="4" width="14" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 15 3-4 2 2 3-4" />
                <rect x="8" y="7" width="14" height="14" rx="2" />
              </svg>
              <p className="text-ink-soft text-sm">Drag photos and videos here</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleInputChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm"
              >
                Select from computer
              </button>
            </div>
          )}

          {step === 'edit' && (
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[55vh]">
                {mediaType === 'video' ? (
                  <video src={previewUrl} controls className="max-h-[55vh] max-w-full" />
                ) : (
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="preview"
                    crossOrigin="anonymous"
                    className={`max-h-[55vh] max-w-full ${aspect === 'square' ? 'aspect-square object-cover' : 'object-contain'}`}
                    style={{ filter: filter.css }}
                  />
                )}
              </div>

              <div className="sm:w-56 shrink-0 p-4 space-y-4 border-t sm:border-t-0 sm:border-l border-line">
                <div>
                  <p className="text-xs font-semibold text-ink-soft mb-2">Crop</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAspect('original')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        aspect === 'original' ? 'border-accent text-accent bg-accent-soft' : 'border-line text-ink-soft'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setAspect('square')}
                      disabled={mediaType === 'video'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 ${
                        aspect === 'square' ? 'border-accent text-accent bg-accent-soft' : 'border-line text-ink-soft'
                      }`}
                    >
                      Square
                    </button>
                  </div>
                </div>

                {mediaType === 'image' && (
                  <div>
                    <p className="text-xs font-semibold text-ink-soft mb-2">Filters</p>
                    <div className="grid grid-cols-3 gap-2">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilterId(f.id)}
                          className={`rounded-lg overflow-hidden border ${
                            filterId === f.id ? 'border-accent' : 'border-line'
                          }`}
                        >
                          <img src={previewUrl} alt={f.label} style={{ filter: f.css }} className="h-14 w-full object-cover" />
                          <p className={`text-[10px] py-1 ${filterId === f.id ? 'text-accent font-semibold' : 'text-ink-soft'}`}>
                            {f.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'share' && (
            <div className="flex flex-col sm:flex-row">
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px] max-h-[50vh]">
                {files ? (
                  <>
                    {files[carouselIndex].type.startsWith('video/') ? (
                      <video src={URL.createObjectURL(files[carouselIndex])} controls className="max-h-[50vh] max-w-full" />
                    ) : (
                      <img
                        src={URL.createObjectURL(files[carouselIndex])}
                        alt="preview"
                        className="max-h-[50vh] max-w-full object-contain"
                      />
                    )}
                    {files.length > 1 && (
                      <>
                        {carouselIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => setCarouselIndex((i) => i - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                          >
                            &larr;
                          </button>
                        )}
                        {carouselIndex < files.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setCarouselIndex((i) => i + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                          >
                            &rarr;
                          </button>
                        )}
                        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                          {carouselIndex + 1}/{files.length}
                        </div>
                      </>
                    )}
                  </>
                ) : mediaType === 'video' ? (
                  <video src={previewUrl} controls className="max-h-[50vh] max-w-full" />
                ) : (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className={`max-h-[50vh] max-w-full ${aspect === 'square' ? 'aspect-square object-cover' : 'object-contain'}`}
                    style={{ filter: filter.css }}
                  />
                )}
              </div>

              <div className="sm:w-72 shrink-0 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar user={user} size="sm" />
                  <p className="text-sm font-semibold">{user?.username || user?.name}</p>
                </div>
                <textarea
                  className="input w-full"
                  rows={4}
                  maxLength={2200}
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <p className="text-xs text-ink-soft text-right">{caption.length}/2,200</p>

                <div>
                  <p className="text-xs font-semibold text-ink-soft mb-1">Who can see this</p>
                  <select
                    className="text-sm rounded-lg border border-line bg-paper px-2 py-1.5 w-full"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="only_me">Only me</option>
                  </select>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
