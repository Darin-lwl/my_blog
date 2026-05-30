import { json, error, verifyAuth } from '../../_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  // 确保表存在
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
    'SELECT * FROM links ORDER BY ` + '`order`' + ` ASC, id ASC'
  ).all();

  return json(results.map(l => ({
    ...l,
    visible: !!l.visible,
  })));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const body = await request.json();
  const { name, url, avatar, description } = body;

  if (!name || !name.trim()) {
    return error('名称不能为空');
  }

  if (!url || !url.trim()) {
    return error('链接不能为空');
  }

  // 确保表存在
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

  // 获取当前最大排序值
  const { results: maxOrder } = await env.DB.prepare(
    'SELECT COALESCE(MAX(` + '`order`' + `), -1) as maxOrder FROM links'
  ).all();
  const newOrder = (maxOrder[0]?.maxOrder || -1) + 1;

  const result = await env.DB.prepare(
    'INSERT INTO links (name, url, avatar, description, ` + '`order`' + `) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    name.trim(),
    url.trim(),
    avatar || '',
    description || '',
    newOrder
  ).run();

  return json({
    id: result.meta.last_row_id,
    name: name.trim(),
    url: url.trim(),
    avatar: avatar || '',
    description: description || '',
    visible: 1,
    order: newOrder,
  }, 201);
}
