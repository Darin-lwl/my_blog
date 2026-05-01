import { json, error } from '../_utils.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  const { slug } = params;

  const post = await env.DB.prepare(
    'SELECT * FROM posts WHERE slug = ?'
  ).bind(slug).first();

  if (!post) {
    return error('文章不存在', 404);
  }

  return json({
    ...post,
    tags: JSON.parse(post.tags || '[]'),
    featured: !!post.featured,
    draft: !!post.draft,
  });
}
