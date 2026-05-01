import { json } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    'SELECT tags FROM posts WHERE draft = 0'
  ).all();

  const map = {};
  for (const row of results) {
    const tags = JSON.parse(row.tags || '[]');
    for (const t of tags) {
      map[t] = (map[t] || 0) + 1;
    }
  }

  const sorted = Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return json(sorted);
}
