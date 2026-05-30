import { json, error, verifyAuth } from '../../_utils.js';

// PUT /api/admin/comments/:id — 审核评论（修改状态）
export async function onRequestPut(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const { id } = params;
  let body;

  try {
    body = await request.json();
  } catch {
    return error('请求格式错误');
  }

  const { status } = body;
  if (status !== 0 && status !== 1) return error('无效的状态值');

  const result = await env.DB.prepare(
    'UPDATE comments SET status = ? WHERE id = ?'
  ).bind(status, id).run();

  if (result.meta.changes === 0) return error('评论不存在', 404);

  return json({ message: '评论状态已更新' });
}

// DELETE /api/admin/comments/:id — 删除评论
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const { id } = params;

  const result = await env.DB.prepare(
    'DELETE FROM comments WHERE id = ?'
  ).bind(id).run();

  if (result.meta.changes === 0) return error('评论不存在', 404);

  return json({ message: '评论已删除' });
}
