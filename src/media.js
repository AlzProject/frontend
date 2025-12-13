import axios from 'axios';
import api from './api';

export async function createPresignedUpload({ type, label }) {
  const payload = {
    type,
    label,
  };

  const res = await api.post('/media', payload);
  const data = res?.data || {};

  if (!data.presignedUrl || !data.id) {
    throw new Error(`Invalid /media response: ${JSON.stringify(data)}`);
  }

  return {
    id: data.id,
    presignedUrl: data.presignedUrl,
    url: data.url,
    version: data.version,
  };
}

export async function uploadToPresignedUrl({ presignedUrl, fileOrBlob, contentType }) {
  await axios.put(presignedUrl, fileOrBlob, {
    headers: {
      'Content-Type': contentType || fileOrBlob?.type || 'application/octet-stream',
    },
  });
}

export async function attachMediaToQuestion({ questionId, mediaId }) {
  if (!questionId || !mediaId) return;
  await api.post(`/questions/${questionId}/media/${mediaId}`);
}

export async function uploadMediaAndGetAnswerText({
  questionId,
  fileOrBlob,
  type,
  label,
  attachToQuestion = true,
}) {
  const { id, presignedUrl } = await createPresignedUpload({ type, label });

  await uploadToPresignedUrl({
    presignedUrl,
    fileOrBlob,
    contentType: fileOrBlob?.type,
  });

  if (attachToQuestion) {
    try {
      await attachMediaToQuestion({ questionId, mediaId: id });
    } catch (e) {
      // Non-fatal: response can still reference media by id.
      console.warn('Failed to attach media to question', { questionId, mediaId: id, error: e });
    }
  }

  return `media:${id}`;
}

export async function getPresignedDownloadUrl(mediaId) {
  const res = await api.get(`/media/${mediaId}/download`);
  return res?.data?.presignedUrl;
}
