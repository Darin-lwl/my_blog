import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data/posts.json'), 'utf-8'));
const uploadsDir = join(process.cwd(), 'uploads');

console.log('=== 数据迁移脚本 ===\n');

// Generate D1 SQL
const lines = ['-- D1 数据迁移 SQL', ''];

for (const post of data.posts) {
  const tags = JSON.stringify(post.tags || []);
  const escape = (s) => (s || '').replace(/'/g, "''");

  lines.push(`INSERT OR REPLACE INTO posts (slug, title, date, category, tags, summary, content, featured, draft, createdAt, updatedAt) VALUES (`);
  lines.push(`  '${escape(post.slug)}',`);
  lines.push(`  '${escape(post.title)}',`);
  lines.push(`  '${escape(post.date)}',`);
  lines.push(`  '${escape(post.category || '未分类')}',`);
  lines.push(`  '${escape(tags)}',`);
  lines.push(`  '${escape(post.summary)}',`);
  lines.push(`  '${escape(post.content)}',`);
  lines.push(`  ${post.featured ? 1 : 0},`);
  lines.push(`  ${post.draft ? 1 : 0},`);
  lines.push(`  '${escape(post.createdAt)}',`);
  lines.push(`  '${escape(post.updatedAt)}'`);
  lines.push(`);`);
  lines.push('');
}

// Init visits counter
lines.push('INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0);');

const sql = lines.join('\n');
writeFileSync('migration.sql', sql);
console.log('✅ 已生成 migration.sql');
console.log(`   包含 ${data.posts.length} 篇文章的 INSERT 语句\n`);

// List images
try {
  const files = readdirSync(uploadsDir);
  if (files.length > 0) {
    console.log(`📁 uploads/ 目录中有 ${files.length} 个图片文件：`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('\n上传图片到 R2 的命令：');
    files.forEach(f => {
      console.log(`   npx wrangler r2 object put blog-uploads/${f} --file=uploads/${f}`);
    });
  } else {
    console.log('📁 uploads/ 目录为空，无需上传图片');
  }
} catch {
  console.log('📁 uploads/ 目录不存在，无需上传图片');
}

console.log('\n=== 迁移步骤 ===');
console.log('1. 在 Cloudflare Dashboard 创建 D1 数据库（名为 blog-db）');
console.log('2. 在 Cloudflare Dashboard 创建 R2 存储桶（名为 blog-uploads）');
console.log('3. 将 D1 database_id 填入 wrangler.toml');
console.log('4. 执行建表：npx wrangler d1 execute blog-db --file=schema.sql');
console.log('5. 执行迁移：npx wrangler d1 execute blog-db --file=migration.sql');
console.log('6. 上传图片：执行上面列出的 r2 命令');
console.log('7. 推送代码到 GitHub，在 Cloudflare Pages 连接仓库并部署');
