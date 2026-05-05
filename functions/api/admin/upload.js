import { json, error, verifyAuth } from '../_utils.js';

const CHUNK_SIZE = 50000; // ~50KB per chunk (base64 stays under D1 statement limit)

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const formData = await request.formData();
  const file = formData.get('image');

  if (!file || typeof file === 'string') {
    return error('请选择图片文件');
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (!allowed.includes(ext)) {
    return error('不支持的图片格式');
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const now = new Date().toISOString();
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Split into chunks
  const totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, bytes.length);
    const chunk = bytes.slice(start, end);
    let binary = '';
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
    const base64 = btoa(binary);

    await env.DB.prepare(
      'INSERT INTO images (filename, chunk_index, data, contentType, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).bind(filename, i, base64, file.type, now).run();
  }

  return json({ url: `/api/uploads/${filename}` }, 201);
}
