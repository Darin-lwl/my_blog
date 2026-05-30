import { json, error, verifyAuth, generateSlug, parseTags } from '../../_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM posts ORDER BY date DESC'
  ).all();

  const posts = results.map(p => ({
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    featured: !!p.featured,
    draft: !!p.draft,
  }));

  return json(posts);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const body = await request.json();
  const { title, category, tags, summary, content, coverImage, featured, draft } = body;

  const slug = await generateSlug(title, env.DB);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO posts (slug, title, date, category, tags, summary, content, coverImage, featured, draft, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    slug,
    title || '未命名',
    body.date || now.slice(0, 10),
    category || '未分类',
    parseTags(tags),
    summary || '',
    content || '',
    coverImage || '',
    featured ? 1 : 0,
    draft !== false ? 1 : 0,
    now,
    now
  ).run();

  return json({ slug, message: '文章已创建' }, 201);
}
