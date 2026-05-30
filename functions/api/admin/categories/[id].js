import { json, error, verifyAuth } from '../../_utils.js';

export async function onRequestPut(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return error('无效的 ID');
  }

  const body = await request.json();
  const { name, icon, description, visible, order } = body;

  // 检查分类是否存在
  const { results: existing } = await env.DB.prepare(
    'SELECT * FROM categories WHERE id = ?'
  ).bind(id).all();

  if (existing.length === 0) {
    return error('分类不存在', 404);
  }

  // 如果要改名，检查是否重复
  if (name && name.trim()) {
    const { results: duplicate } = await env.DB.prepare(
      'SELECT id FROM categories WHERE name = ? AND id != ?'
    ).bind(name.trim(), id).all();

    if (duplicate.length > 0) {
      return error('分类名称已存在');
    }
  }

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
  if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (visible !== undefined) { updates.push('visible = ?'); values.push(visible ? 1 : 0); }
  if (order !== undefined) { updates.push('`order` = ?'); values.push(order); }

  if (updates.length === 0) {
    return error('没有要更新的内容');
  }

  values.push(id);
  await env.DB.prepare(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  // 返回更新后的数据
  const { results: updated } = await env.DB.prepare(
    'SELECT * FROM categories WHERE id = ?'
  ).bind(id).all();

  return json({
    ...updated[0],
    visible: !!updated[0].visible,
  });
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return error('无效的 ID');
  }

  // 检查分类是否存在
  const { results: existing } = await env.DB.prepare(
    'SELECT id FROM categories WHERE id = ?'
  ).bind(id).all();

  if (existing.length === 0) {
    return error('分类不存在', 404);
  }

  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

  return json({ message: '已删除' });
}
