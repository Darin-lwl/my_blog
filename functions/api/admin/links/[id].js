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
  const { name, url, avatar, description, visible, order } = body;

  // 检查友链是否存在
  const { results: existing } = await env.DB.prepare(
    'SELECT * FROM links WHERE id = ?'
  ).bind(id).all();

  if (existing.length === 0) {
    return error('友链不存在', 404);
  }

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
  if (url !== undefined) { updates.push('url = ?'); values.push(url.trim()); }
  if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (visible !== undefined) { updates.push('visible = ?'); values.push(visible ? 1 : 0); }
  if (order !== undefined) { updates.push('"order" = ?'); values.push(order); }

  if (updates.length === 0) {
    return error('没有要更新的内容');
  }

  values.push(id);
  await env.DB.prepare(
    `UPDATE links SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  // 返回更新后的数据
  const { results: updated } = await env.DB.prepare(
    'SELECT * FROM links WHERE id = ?'
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

  // 检查友链是否存在
  const { results: existing } = await env.DB.prepare(
    'SELECT id FROM links WHERE id = ?'
  ).bind(id).all();

  if (existing.length === 0) {
    return error('友链不存在', 404);
  }

  await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();

  return json({ message: '已删除' });
}
