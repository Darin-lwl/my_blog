import { json, error, verifyAuth } from '../_utils.js';

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

  await env.R2.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ url: `/api/uploads/${filename}` }, 201);
}
