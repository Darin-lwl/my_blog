import { json, error, verifyAuth, parseTags } from '../../_utils.js';

export async function onRequestPut(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const slug = decodeURIComponent(params.slug);
  const body = await request.json();

  const existing = await env.DB.prepare(
    'SELECT slug FROM posts WHERE slug = ?'
  ).bind(slug).first();

  if (!existing) {
    return error('文章不存在', 404);
  }

  const now = new Date().toISOString();
  const { title, category, tags, summary, content, coverImage, featured, draft } = body;

  const current = await env.DB.prepare(
    'SELECT * FROM posts WHERE slug = ?'
  ).bind(slug).first();

  await env.DB.prepare(
    `UPDATE posts SET title = ?, category = ?, tags = ?, summary = ?, content = ?, coverImage = ?, featured = ?, draft = ?, date = ?, updatedAt = ? WHERE slug = ?`
  ).bind(
    title ?? current.title,
    category ?? current.category,
    tags !== undefined ? parseTags(tags) : current.tags,
    summary ?? current.summary,
    content ?? current.content,
    coverImage ?? current.coverImage,
    featured !== undefined ? (featured ? 1 : 0) : current.featured,
    draft !== undefined ? (draft ? 1 : 0) : current.draft,
    body.date ?? current.date,
    now,
    slug
  ).run();

  return json({ message: '文章已更新' });
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const slug = decodeURIComponent(params.slug);

  const existing = await env.DB.prepare(
    'SELECT slug FROM posts WHERE slug = ?'
  ).bind(slug).first();

  if (!existing) {
    return error('文章不存在', 404);
  }

  await env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run();

  return json({ message: '文章已删除' });
}
