import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data/posts.json'), 'utf-8'));
const uploadsDir = join(process.cwd(), 'uploads');

console.log('=== 数据迁移脚本 ===\n');

// Generate D1 SQL
const lines = ['-- D1 数据迁移 SQL', ''];

// Posts
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
lines.push('');

// Images
try {
  const files = readdirSync(uploadsDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));

  if (imageFiles.length > 0) {
    console.log(`📁 发现 ${imageFiles.length} 个图片文件`);
    const now = new Date().toISOString();

    for (const file of imageFiles) {
      const filePath = join(uploadsDir, file);
      const buffer = readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const ext = file.split('.').pop().toLowerCase();
      const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }[ext] || 'image/png';
      const escape = (s) => s.replace(/'/g, "''");

      lines.push(`INSERT OR REPLACE INTO images (filename, data, contentType, createdAt) VALUES (`);
      lines.push(`  '${escape(file)}',`);
      lines.push(`  '${escape(base64)}',`);
      lines.push(`  '${mime}',`);
      lines.push(`  '${now}'`);
      lines.push(`);`);
      lines.push('');
      console.log(`   ✅ ${file} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
  }
} catch {
  console.log('📁 uploads/ 目录不存在，跳过图片迁移');
}

const sql = lines.join('\n');
writeFileSync('migration.sql', sql);
console.log(`\n✅ 已生成 migration.sql（${data.posts.length} 篇文章）`);

console.log('\n=== 迁移步骤 ===');
console.log('1. 在 Cloudflare Dashboard → D1 创建数据库 blog-db');
console.log('2. 复制数据库 ID，填入 wrangler.toml 的 database_id');
console.log('3. 建表：npx wrangler d1 execute blog-db --remote --file=schema.sql');
console.log('4. 迁移数据：npx wrangler d1 execute blog-db --remote --file=migration.sql');
console.log('5. 推送代码到 GitHub');
console.log('6. 在 Cloudflare Pages 连接仓库，设置构建命令 npm run build，输出 dist');
console.log('7. 在 Pages Settings → Variables 中添加 JWT_SECRET 和 ADMIN_PASSWORD');
console.log('8. 在 Pages Settings → Bindings 中添加 D1 绑定（变量名 DB，选择 blog-db）');
