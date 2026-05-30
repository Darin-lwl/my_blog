import { json } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  // 确保 links 表存在
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      description TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      ` + '`order`' + ` INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `).run();

  const { results } = await env.DB.prepare(
    'SELECT * FROM links WHERE visible = 1 ORDER BY ` + '`order`' + ` ASC, id ASC'
  ).all();

  return json(results.map(l => ({
    ...l,
    visible: !!l.visible,
  })));
}
