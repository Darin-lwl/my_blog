import { json } from '../_utils.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    'SELECT * FROM posts WHERE draft = 0 ORDER BY date DESC'
  ).all();

  const posts = results.map(p => ({
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    featured: !!p.featured,
    draft: !!p.draft,
  }));

  return json(posts);
}
