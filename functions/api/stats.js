import { json } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  const postCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE draft = 0'
  ).first();

  const { results: posts } = await env.DB.prepare(
    'SELECT content FROM posts WHERE draft = 0'
  ).all();

  const totalWords = posts.reduce((sum, p) => sum + (p.content?.length || 0), 0);
  const startDate = new Date('2024-01-01');
  const daysSince = Math.floor((Date.now() - startDate.getTime()) / 86400000);

  await env.DB.prepare(
    'UPDATE visits SET count = count + 1 WHERE id = 1'
  ).run();

  const visits = await env.DB.prepare(
    'SELECT count FROM visits WHERE id = 1'
  ).first();

  return json({
    totalWords,
    daysSince,
    todayVisits: visits?.count || 0,
  });
}
