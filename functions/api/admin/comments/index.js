import { json, error, verifyAuth } from '../../_utils.js';

// GET /api/admin/comments — 获取所有评论（含待审核）
export async function onRequestGet(context) {
  const { env, request } = context;
  if (!await verifyAuth(request, env)) {
    return error('未授权', 401);
  }

  const { results } = await env.DB.prepare(
    'SELECT c.*, p.title as post_title FROM comments c LEFT JOIN posts p ON c.post_slug = p.slug ORDER BY c.created_at DESC'
  ).all();

  return json(results);
}
