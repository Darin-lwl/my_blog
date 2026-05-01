import { json } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT COALESCE(NULLIF(category, ''), '未分类') as name, COUNT(*) as count FROM posts WHERE draft = 0 GROUP BY name ORDER BY count DESC"
  ).all();

  return json(results);
}
