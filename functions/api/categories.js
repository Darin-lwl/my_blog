import { json } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  // 确保 categories 表存在
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

  // 获取分类信息
  const { results: categories } = await env.DB.prepare(
    'SELECT * FROM categories WHERE visible = 1 ORDER BY "order" ASC, id ASC'
  ).all();

  // 统计每个分类的文章数量
  const { results: postCounts } = await env.DB.prepare(
    "SELECT COALESCE(NULLIF(category, ''), '未分类') as name, COUNT(*) as count FROM posts WHERE draft = 0 GROUP BY name"
  ).all();

  const countMap = {};
  postCounts.forEach(pc => {
    countMap[pc.name] = pc.count;
  });

  // 合并数据
  const result = categories.map(c => ({
    ...c,
    count: countMap[c.name] || 0,
    visible: !!c.visible,
  }));

  // 添加未分类（如果有文章）
  if (countMap['未分类']) {
    result.push({
      name: '未分类',
      icon: '📄',
      description: '未分类的文章',
      count: countMap['未分类'],
    });
  }

  return json(result);
}
