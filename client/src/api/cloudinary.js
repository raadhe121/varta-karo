// Staging/production sets VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET,
// so uploads go straight from the browser to Cloudinary and never touch the
// backend's ephemeral disk. Local dev leaves those unset, so we fall back to
// our own /api/media/upload endpoint, which stores the file under
// server/src/uploads and serves it back at /uploads/....
import { http } from './http';
import { resolveMediaUrl } from '../utils/media';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || 'Upload failed');
  }
  const data = await res.json();

  return {
    url: data.secure_url,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

async function uploadToLocalServer(file) {
  const form = new FormData();
  form.append('file', file);

  const { data } = await http.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    url: resolveMediaUrl(data.url),
    originalName: data.originalName,
    mimeType: data.mimeType,
    size: data.size,
  };
}

export async function uploadMedia(file) {
  if (CLOUD_NAME && UPLOAD_PRESET) {
    return uploadToCloudinary(file);
  }
  return uploadToLocalServer(file);
}
