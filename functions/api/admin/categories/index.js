import { json, error, verifyAuth } from '../../_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  // 确保表存在
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '📄',
      description TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `).run();

  const { results } = await env.DB.prepare(
    'SELECT * FROM categories ORDER BY "order" ASC, id ASC'
  ).all();

  return json(results.map(c => ({
    ...c,
    visible: !!c.visible,
  })));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const body = await request.json();
  const { name, icon, description } = body;

  if (!name || !name.trim()) {
    return error('分类名称不能为空');
  }

  // 确保表存在
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '📄',
      description TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `).run();

  // 检查名称是否重复
  const { results: existing } = await env.DB.prepare(
    'SELECT id FROM categories WHERE name = ?'
  ).bind(name.trim()).all();

  if (existing.length > 0) {
    return error('分类名称已存在');
  }

  // 获取当前最大排序值
  const { results: maxOrder } = await env.DB.prepare(
    'SELECT COALESCE(MAX("order"), -1) as maxOrder FROM categories'
  ).all();
  const newOrder = (maxOrder[0]?.maxOrder || -1) + 1;

  const result = await env.DB.prepare(
    'INSERT INTO categories (name, icon, description, "order") VALUES (?, ?, ?, ?)'
  ).bind(
    name.trim(),
    icon || '📄',
    description || '',
    newOrder
  ).run();

  return json({
    id: result.meta.last_row_id,
    name: name.trim(),
    icon: icon || '📄',
    description: description || '',
    visible: 1,
    order: newOrder,
  }, 201);
}
