import { json, error } from '../_utils.js';

// 特殊页面的 slug（不需要检查文章是否存在）
const SPECIAL_SLUGS = ['friend-links'];

// GET /api/comments?slug=xxx — 获取文章已发布的评论
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) return error('缺少 slug 参数', 400);

  const { results } = await env.DB.prepare(
    'SELECT id, post_slug, nickname, content, parent_id, created_at FROM comments WHERE post_slug = ? AND status = 1 ORDER BY created_at DESC'
  ).bind(slug).all();

  return json(results);
}

// POST /api/comments — 提交评论
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;

  try {
    body = await request.json();
  } catch {
    return error('请求格式错误');
  }

  const { slug, nickname, content, parentId = 0 } = body;

  // 校验
  if (!slug) return error('缺少文章 slug');
  if (!nickname || nickname.trim().length === 0) return error('请输入昵称');
  if (!content || content.trim().length < 2) return error('评论内容至少 2 个字符');

  // 检查文章是否存在（特殊页面跳过检查）
  if (!SPECIAL_SLUGS.includes(slug)) {
    const post = await env.DB.prepare('SELECT slug FROM posts WHERE slug = ? AND draft = 0')
      .bind(slug).first();
    if (!post) return error('文章不存在', 404);
  }

  // 简单频率限制：同一 IP 同一文章 30 秒内不能重复提交
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const recent = await env.DB.prepare(
    'SELECT id FROM comments WHERE post_slug = ? AND created_at > datetime("now", "-30 seconds") AND nickname = ?'
  ).bind(slug, nickname.trim()).first();

  if (recent) return error('请勿频繁提交评论');

  const now = new Date().toISOString();

  const result = await env.DB.prepare(
    'INSERT INTO comments (post_slug, nickname, content, parent_id, status, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).bind(slug, nickname.trim(), content.trim(), parentId, now).run();

  return json({ id: result.meta.last_row_id, message: '评论已提交，等待审核' }, 201);
}
